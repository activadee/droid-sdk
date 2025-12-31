import { describe, expect, it } from 'bun:test';
import { buildPromptWithAttachments } from '../src/cli/process';
import type { FileAttachment } from '../src/types';

describe('buildPromptWithAttachments', () => {
	it('should return undefined when both prompt and attachments are empty', () => {
		expect(buildPromptWithAttachments(undefined, undefined)).toBeUndefined();
		expect(buildPromptWithAttachments(undefined, [])).toBeUndefined();
		expect(buildPromptWithAttachments('', undefined)).toBeUndefined();
		expect(buildPromptWithAttachments('', [])).toBeUndefined();
	});

	it('should return prompt as-is when no attachments', () => {
		const prompt = 'Describe this code';
		expect(buildPromptWithAttachments(prompt, undefined)).toBe(prompt);
		expect(buildPromptWithAttachments(prompt, [])).toBe(prompt);
	});

	it('should prepend single attachment with @ syntax', () => {
		const prompt = 'Describe this image';
		const attachments: FileAttachment[] = [{ path: './screenshot.png', type: 'image' }];

		const result = buildPromptWithAttachments(prompt, attachments);

		expect(result).toBe('@./screenshot.png\n\nDescribe this image');
	});

	it('should prepend multiple attachments', () => {
		const prompt = 'Review these files';
		const attachments: FileAttachment[] = [
			{ path: './src/main.ts', type: 'text' },
			{ path: './data.json', type: 'data' },
		];

		const result = buildPromptWithAttachments(prompt, attachments);

		expect(result).toBe('@./src/main.ts\n@./data.json\n\nReview these files');
	});

	it('should include description when provided', () => {
		const prompt = 'Implement this design';
		const attachments: FileAttachment[] = [
			{ path: './mockup.png', type: 'image', description: 'UI mockup from Figma' },
		];

		const result = buildPromptWithAttachments(prompt, attachments);

		expect(result).toBe('@./mockup.png (UI mockup from Figma)\n\nImplement this design');
	});

	it('should handle mixed attachments with and without descriptions', () => {
		const prompt = 'Build this feature';
		const attachments: FileAttachment[] = [
			{ path: './design.png', type: 'image', description: 'The design' },
			{ path: './spec.md', type: 'text' },
			{ path: './config.json', type: 'data', description: 'Configuration file' },
		];

		const result = buildPromptWithAttachments(prompt, attachments);

		expect(result).toBe(
			'@./design.png (The design)\n@./spec.md\n@./config.json (Configuration file)\n\nBuild this feature',
		);
	});

	it('should return only attachments when prompt is undefined', () => {
		const attachments: FileAttachment[] = [{ path: './file.txt', type: 'text' }];

		const result = buildPromptWithAttachments(undefined, attachments);

		expect(result).toBe('@./file.txt');
	});

	it('should handle absolute paths', () => {
		const prompt = 'Process this file';
		const attachments: FileAttachment[] = [{ path: '/home/user/data.csv', type: 'data' }];

		const result = buildPromptWithAttachments(prompt, attachments);

		expect(result).toBe('@/home/user/data.csv\n\nProcess this file');
	});

	it('should handle all attachment types', () => {
		const attachments: FileAttachment[] = [
			{ path: './image.png', type: 'image' },
			{ path: './code.ts', type: 'text' },
			{ path: './data.json', type: 'data' },
			{ path: './unknown.xyz', type: 'other' },
		];

		const result = buildPromptWithAttachments('Process all', attachments);

		expect(result).toBe('@./image.png\n@./code.ts\n@./data.json\n@./unknown.xyz\n\nProcess all');
	});
});
