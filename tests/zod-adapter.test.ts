import { describe, expect, it } from 'bun:test';
import { isZodSchema, zodToJsonSchema } from '../src/schemas/zod-adapter';

const createMockZodString = (checks: Array<{ kind: string; value?: unknown }> = []) => ({
	_def: { typeName: 'ZodString', checks },
});

const createMockZodNumber = (checks: Array<{ kind: string; value?: unknown }> = []) => ({
	_def: { typeName: 'ZodNumber', checks },
});

const createMockZodObject = (
	shape: Record<string, { _def: { typeName: string; checks?: unknown[] } }>,
) => ({
	_def: {
		typeName: 'ZodObject',
		shape: () => shape,
	},
});

describe('zodToJsonSchema', () => {
	describe('primitive types', () => {
		it('should convert ZodString', () => {
			const schema = createMockZodString();
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('string');
		});

		it('should convert ZodString with constraints', () => {
			const schema = createMockZodString([
				{ kind: 'min', value: 1 },
				{ kind: 'max', value: 100 },
			]);
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('string');
			expect(result.minLength).toBe(1);
			expect(result.maxLength).toBe(100);
		});

		it('should convert ZodString with email format', () => {
			const schema = createMockZodString([{ kind: 'email' }]);
			const result = zodToJsonSchema(schema);
			expect(result.format).toBe('email');
		});

		it('should convert ZodNumber', () => {
			const schema = createMockZodNumber();
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('number');
		});

		it('should convert ZodNumber with constraints', () => {
			const schema = createMockZodNumber([
				{ kind: 'min', value: 0 },
				{ kind: 'max', value: 100 },
			]);
			const result = zodToJsonSchema(schema);
			expect(result.minimum).toBe(0);
			expect(result.maximum).toBe(100);
		});

		it('should convert ZodNumber with int check', () => {
			const schema = createMockZodNumber([{ kind: 'int' }]);
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('integer');
		});

		it('should convert ZodBoolean', () => {
			const schema = { _def: { typeName: 'ZodBoolean' } };
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('boolean');
		});

		it('should convert ZodNull', () => {
			const schema = { _def: { typeName: 'ZodNull' } };
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('null');
		});
	});

	describe('complex types', () => {
		it('should convert ZodArray', () => {
			const schema = {
				_def: {
					typeName: 'ZodArray',
					type: createMockZodString(),
				},
			};
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('array');
			expect(result.items?.type).toBe('string');
		});

		it('should convert ZodObject', () => {
			const schema = createMockZodObject({
				name: createMockZodString(),
				age: createMockZodNumber(),
			});

			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('object');
			expect(result.properties?.name?.type).toBe('string');
			expect(result.properties?.age?.type).toBe('number');
			expect(result.required).toContain('name');
			expect(result.required).toContain('age');
		});

		it('should handle optional fields', () => {
			const schema = createMockZodObject({
				required: createMockZodString(),
				optional: {
					_def: {
						typeName: 'ZodOptional',
						innerType: createMockZodString(),
					},
				},
			});

			const result = zodToJsonSchema(schema);
			expect(result.required).toContain('required');
			expect(result.required).not.toContain('optional');
		});

		it('should convert ZodEnum', () => {
			const schema = {
				_def: {
					typeName: 'ZodEnum',
					values: ['a', 'b', 'c'],
				},
			};
			const result = zodToJsonSchema(schema);
			expect(result.type).toBe('string');
			expect(result.enum).toEqual(['a', 'b', 'c']);
		});

		it('should convert ZodUnion', () => {
			const schema = {
				_def: {
					typeName: 'ZodUnion',
					options: [createMockZodString(), createMockZodNumber()],
				},
			};
			const result = zodToJsonSchema(schema);
			expect(result.oneOf?.length).toBe(2);
		});

		it('should convert ZodNullable', () => {
			const schema = {
				_def: {
					typeName: 'ZodNullable',
					innerType: createMockZodString(),
				},
			};
			const result = zodToJsonSchema(schema);
			expect(result.oneOf?.length).toBe(2);
		});
	});

	describe('edge cases', () => {
		it('should return empty object for ZodAny', () => {
			const schema = { _def: { typeName: 'ZodAny' } };
			const result = zodToJsonSchema(schema);
			expect(result).toEqual({});
		});

		it('should return empty object for unknown types', () => {
			const schema = { _def: { typeName: 'ZodUnknownType' } };
			const result = zodToJsonSchema(schema);
			expect(result).toEqual({});
		});

		it('should return empty object when no _def', () => {
			const schema = {};
			const result = zodToJsonSchema(schema);
			expect(result).toEqual({});
		});
	});
});

describe('isZodSchema', () => {
	it('should return true for valid Zod schema', () => {
		const schema = { _def: { typeName: 'ZodString' } };
		expect(isZodSchema(schema)).toBe(true);
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
});
