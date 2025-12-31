#!/usr/bin/env bun
/**
 * Documentation generation script for Mintlify.
 *
 * This script:
 * 1. Uses TypeDoc to extract JSDoc from TypeScript source files
 * 2. Generates Markdown/MDX files compatible with Mintlify
 * 3. Organizes output into the docs/ directory structure
 *
 * Usage:
 *   bun run scripts/generate-docs.ts
 *
 * Prerequisites:
 *   bun add -d typedoc typedoc-plugin-markdown
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT_DIR = join(import.meta.dir, '..');

/**
 * Run a command and wait for it to complete.
 */
async function run(command: string, args: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		console.log(`Running: ${command} ${args.join(' ')}`);
		const proc = spawn(command, args, {
			cwd: ROOT_DIR,
			stdio: 'inherit',
		});

		proc.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Command failed with code ${code}`));
			}
		});

		proc.on('error', reject);
	});
}

/**
 * Ensure the docs directory structure exists.
 */
function ensureDocsStructure(): void {
	const dirs = [
		'docs',
		'docs/api-reference',
		'docs/api-reference/classes',
		'docs/api-reference/errors',
		'docs/api-reference/types',
		'docs/api-reference/cli',
		'docs/api-reference/models',
		'docs/concepts',
		'docs/guides',
		'docs/logo',
	];

	for (const dir of dirs) {
		const fullPath = join(ROOT_DIR, dir);
		if (!existsSync(fullPath)) {
			mkdirSync(fullPath, { recursive: true });
			console.log(`Created: ${dir}`);
		}
	}
}

/**
 * Generate API documentation using TypeDoc.
 */
async function generateTypeDocs(): Promise<void> {
	console.log('\n📚 Generating API documentation with TypeDoc...\n');

	try {
		await run('bunx', ['typedoc']);
		console.log('\n✅ API documentation generated successfully!\n');
	} catch (error) {
		console.error('\n❌ Failed to generate API documentation');
		console.error('Make sure typedoc and typedoc-plugin-markdown are installed:');
		console.error('  bun add -d typedoc typedoc-plugin-markdown');
		throw error;
	}
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
	console.log('🚀 Droid SDK Documentation Generator\n');
	console.log('=====================================\n');

	// Ensure docs structure
	ensureDocsStructure();

	// Generate TypeDoc documentation
	await generateTypeDocs();

	console.log('📖 Documentation generation complete!');
	console.log('\nNext steps:');
	console.log('  1. Review generated docs in docs/api-reference/');
	console.log('  2. Run `bunx mintlify dev` to preview locally');
	console.log('  3. Deploy to Mintlify when ready');
}

main().catch((error) => {
	console.error('Error:', error.message);
	process.exit(1);
});
