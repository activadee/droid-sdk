import { describe, expect, it } from 'bun:test';
import { Droid } from '../src/droid';
import { Thread } from '../src/thread';
import { DEFAULT_DROID_PATH, DEFAULT_TIMEOUT } from '../src/types';

describe('Droid', () => {
	describe('constructor', () => {
		it('should create with default config', () => {
			const droid = new Droid();
			expect(droid.config.droidPath).toBe(DEFAULT_DROID_PATH);
			expect(droid.config.timeout).toBe(DEFAULT_TIMEOUT);
		});

		it('should accept custom config', () => {
			const droid = new Droid({
				cwd: '/custom/path',
				model: 'claude-sonnet-4-5-20250929',
				autonomyLevel: 'medium',
				timeout: 300000,
			});

			expect(droid.config.cwd).toBe('/custom/path');
			expect(droid.config.model).toBe('claude-sonnet-4-5-20250929');
			expect(droid.config.autonomyLevel).toBe('medium');
			expect(droid.config.timeout).toBe(300000);
		});
	});

	describe('startThread', () => {
		it('should create a new thread', () => {
			const droid = new Droid();
			const thread = droid.startThread();

			expect(thread).toBeInstanceOf(Thread);
			expect(thread.id).toBeUndefined();
		});

		it('should pass thread options to thread', () => {
			const droid = new Droid({ cwd: '/base/path' });
			const thread = droid.startThread({ cwd: '/custom/path' });

			expect(thread.cwd).toBe('/custom/path');
		});

		it('should inherit droid config', () => {
			const droid = new Droid({
				model: 'gpt-5.1-codex',
				autonomyLevel: 'high',
			});

			const thread = droid.startThread();
			expect(thread).toBeInstanceOf(Thread);
		});
	});

	describe('resumeThread', () => {
		it('should create thread with session ID', () => {
			const droid = new Droid();
			const thread = droid.resumeThread('session-abc123');

			expect(thread).toBeInstanceOf(Thread);
			expect(thread.id).toBe('session-abc123');
		});

		it('should pass options to resumed thread', () => {
			const droid = new Droid();
			const thread = droid.resumeThread('session-abc123', {
				cwd: '/project/path',
			});

			expect(thread.cwd).toBe('/project/path');
		});
	});
});
