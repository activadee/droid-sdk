import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import { isZodSchema, zodToJsonSchema } from '../src/schemas/zod-adapter';

describe('zodToJsonSchema', () => {
	describe('primitive types', () => {
		it('should convert z.string()', () => {
			const schema = z.string();
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('string');
		});

		it('should convert z.string() with constraints', () => {
			const schema = z.string().min(1).max(100);
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('string');
			expect(result.minLength).toBe(1);
			expect(result.maxLength).toBe(100);
		});

		it('should convert z.string().email()', () => {
			const schema = z.string().email();
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('string');
			expect(result.format).toBe('email');
		});

		it('should convert z.number()', () => {
			const schema = z.number();
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('number');
		});

		it('should convert z.number() with constraints', () => {
			const schema = z.number().min(0).max(100);
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('number');
			expect(result.minimum).toBe(0);
			expect(result.maximum).toBe(100);
		});

		it('should convert z.number().int()', () => {
			const schema = z.number().int();
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('integer');
		});

		it('should convert z.boolean()', () => {
			const schema = z.boolean();
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('boolean');
		});

		it('should convert z.null()', () => {
			const schema = z.null();
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('null');
		});
	});

	describe('complex types', () => {
		it('should convert z.array()', () => {
			const schema = z.array(z.string());
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('array');
			expect(result.items?.type).toBe('string');
		});

		it('should convert z.object()', () => {
			const schema = z.object({
				name: z.string(),
				age: z.number(),
			});
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('object');
			expect(result.properties?.name?.type).toBe('string');
			expect(result.properties?.age?.type).toBe('number');
			expect(result.required).toContain('name');
			expect(result.required).toContain('age');
		});

		it('should handle optional fields', () => {
			const schema = z.object({
				required: z.string(),
				optional: z.string().optional(),
			});
			const result = zodToJsonSchema(schema);
			expect(result.required).toContain('required');
			expect(result.required).not.toContain('optional');
		});

		it('should convert z.enum()', () => {
			const schema = z.enum(['a', 'b', 'c']);
			const result = zodToJsonSchema(schema);
			expect(result.enum).toEqual(['a', 'b', 'c']);
		});

		it('should convert z.union()', () => {
			const schema = z.union([z.string(), z.number()]);
			const result = zodToJsonSchema(schema);
			expect(result.anyOf?.length).toBe(2);
		});

		it('should convert z.nullable()', () => {
			const schema = z.string().nullable();
			const result = zodToJsonSchema(schema);
			expect(result.anyOf?.length).toBe(2);
		});
	});

	describe('error handling', () => {
		it('should throw for objects without toJSONSchema', () => {
			const notAZodSchema = { type: 'string' };
			expect(() => zodToJsonSchema(notAZodSchema)).toThrow(
				'Schema does not have toJSONSchema method',
			);
		});

		it('should throw for empty objects', () => {
			const emptyObject = {};
			expect(() => zodToJsonSchema(emptyObject)).toThrow(
				'Schema does not have toJSONSchema method',
			);
		});
	});
});

describe('isZodSchema', () => {
	it('should return true for Zod schemas', () => {
		expect(isZodSchema(z.string())).toBe(true);
		expect(isZodSchema(z.number())).toBe(true);
		expect(isZodSchema(z.object({ name: z.string() }))).toBe(true);
	});

	it('should return true for objects with toJSONSchema method', () => {
		const customSchema = { toJSONSchema: () => ({ type: 'string' }) };
		expect(isZodSchema(customSchema)).toBe(true);
	});

	it('should return false for null', () => {
		expect(isZodSchema(null)).toBe(false);
	});

	it('should return false for undefined', () => {
		expect(isZodSchema(undefined)).toBe(false);
	});

	it('should return false for plain object', () => {
		expect(isZodSchema({ type: 'string' })).toBe(false);
	});

	it('should return false for primitives', () => {
		expect(isZodSchema('string')).toBe(false);
		expect(isZodSchema(123)).toBe(false);
		expect(isZodSchema(true)).toBe(false);
	});

	it('should return false for objects with non-function toJSONSchema', () => {
		expect(isZodSchema({ toJSONSchema: 'not a function' })).toBe(false);
	});
});
