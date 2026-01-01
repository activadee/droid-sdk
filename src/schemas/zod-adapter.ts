import type { JsonSchema } from '../types';

/**
 * Internal type representing a Zod schema with toJSONSchema method (Zod 4+).
 *
 * @internal
 */
type ZodSchemaWithJsonSchema = {
	toJSONSchema?: () => JsonSchema;
};

/**
 * Converts a Zod schema to a JSON Schema object.
 *
 * This enables the SDK to accept Zod schemas for structured output
 * validation and convert them to JSON Schema format for the CLI.
 *
 * Requires Zod 4+ which has built-in `toJsonSchema()` support.
 *
 * @param schema - A Zod schema with toJsonSchema method
 * @returns Equivalent JSON Schema object
 * @throws Error if the schema doesn't have a toJsonSchema method
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 *
 * const userSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   age: z.number().optional()
 * });
 *
 * const jsonSchema = zodToJsonSchema(userSchema);
 * // {
 * //   type: 'object',
 * //   properties: {
 * //     name: { type: 'string', minLength: 1 },
 * //     email: { type: 'string', format: 'email' },
 * //     age: { type: 'number' }
 * //   },
 * //   required: ['name', 'email']
 * // }
 * ```
 *
 * @category Schema
 */
export function zodToJsonSchema(schema: ZodSchemaWithJsonSchema): JsonSchema {
	if (typeof schema.toJSONSchema !== 'function') {
		throw new Error(
			'Schema does not have toJSONSchema method. Ensure you are using Zod 4+ or provide a JSON Schema directly.',
		);
	}

	return schema.toJSONSchema();
}

/**
 * Type guard to check if a value is a Zod schema (Zod 4+).
 *
 * @param value - Value to check
 * @returns True if the value appears to be a Zod schema with toJsonSchema support
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 *
 * const schema = z.object({ name: z.string() });
 *
 * if (isZodSchema(schema)) {
 *   const jsonSchema = zodToJsonSchema(schema);
 * }
 * ```
 *
 * @category Schema
 */
export function isZodSchema(value: unknown): value is ZodSchemaWithJsonSchema {
	return (
		typeof value === 'object' &&
		value !== null &&
		'toJSONSchema' in value &&
		typeof (value as ZodSchemaWithJsonSchema).toJSONSchema === 'function'
	);
}
