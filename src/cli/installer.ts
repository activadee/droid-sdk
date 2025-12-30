import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DroidError } from '../errors';
import { findDroidPath } from './process';
import { streamToString, waitForExit } from './utils';

export interface InstallOptions {
	installDir?: string;
	force?: boolean;
	version?: string;
	onProgress?: (progress: InstallProgress) => void;
}

export interface InstallProgress {
	phase: 'checking' | 'downloading' | 'installing' | 'verifying' | 'complete';
	percent?: number;
	message?: string;
}

const INSTALL_SCRIPT_URL = 'https://app.factory.ai/cli';

function getDefaultInstallDir(): string {
	const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
	return join(home, '.droid-sdk', 'bin');
}

export async function isDroidCliInstalled(): Promise<boolean> {
	try {
		await findDroidPath();
		return true;
	} catch {
		return false;
	}
}

export async function getDroidCliPath(): Promise<string | null> {
	try {
		return await findDroidPath();
	} catch {
		return null;
	}
}

export async function ensureDroidCli(options: InstallOptions = {}): Promise<string> {
	const { force = false, onProgress } = options;

	onProgress?.({ phase: 'checking', message: 'Checking for existing installation...' });

	if (!force) {
		const existingPath = await getDroidCliPath();
		if (existingPath) {
			onProgress?.({ phase: 'complete', message: 'Droid CLI already installed' });
			return existingPath;
		}
	}

	const installDir = options.installDir ?? getDefaultInstallDir();

	onProgress?.({ phase: 'downloading', message: 'Downloading installation script...' });

	const platform = process.platform;
	const isWindows = platform === 'win32';

	if (isWindows) {
		return await installWindows(installDir, options);
	}

	return await installUnix(installDir, options);
}

async function installUnix(installDir: string, options: InstallOptions): Promise<string> {
	const { onProgress } = options;

	mkdirSync(installDir, { recursive: true });

	onProgress?.({ phase: 'downloading', percent: 25, message: 'Fetching installer...' });

	const response = await fetch(INSTALL_SCRIPT_URL);
	if (!response.ok) {
		throw new DroidError(`Failed to download installer: ${response.statusText}`);
	}

	const script = await response.text();

	onProgress?.({ phase: 'installing', percent: 50, message: 'Running installer...' });

	const env = {
		...process.env,
		DROID_INSTALL_DIR: installDir,
	};

	const proc = spawn('sh', ['-c', script], {
		env,
		stdio: ['inherit', 'pipe', 'pipe'],
	});

	const exitCode = await waitForExit(proc);

	if (exitCode !== 0) {
		const stderr = await streamToString(proc.stderr);
		throw new DroidError(`Installation failed: ${stderr}`);
	}

	onProgress?.({ phase: 'verifying', percent: 90, message: 'Verifying installation...' });

	const droidPath = join(installDir, 'droid');
	if (!existsSync(droidPath)) {
		const pathDroid = await findDroidPath();
		onProgress?.({ phase: 'complete', percent: 100, message: 'Installation complete' });
		return pathDroid;
	}

	onProgress?.({ phase: 'complete', percent: 100, message: 'Installation complete' });
	return droidPath;
}

async function installWindows(_installDir: string, options: InstallOptions): Promise<string> {
	const { onProgress } = options;

	onProgress?.({
		phase: 'downloading',
		message: 'Windows installation requires PowerShell...',
	});

	const psCommand = 'irm https://app.factory.ai/cli/windows | iex';

	const proc = spawn('powershell', ['-Command', psCommand], {
		stdio: ['inherit', 'pipe', 'pipe'],
	});

	const exitCode = await waitForExit(proc);

	if (exitCode !== 0) {
		const stderr = await streamToString(proc.stderr);
		throw new DroidError(`Windows installation failed: ${stderr}`);
	}

	onProgress?.({ phase: 'verifying', percent: 90, message: 'Verifying installation...' });

	const droidPath = await findDroidPath();
	onProgress?.({ phase: 'complete', percent: 100, message: 'Installation complete' });
	return droidPath;
}
