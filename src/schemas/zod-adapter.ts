import type { JsonSchema } from '../types';

/**
 * Internal type representing a Zod-like schema structure.
 *
 * This type allows the SDK to work with Zod schemas without requiring
 * Zod as a direct dependency.
 *
 * @internal
 */
type ZodTypeLike = {
	_def?: {
		typeName?: string;
		innerType?: ZodTypeLike;
		shape?: () => Record<string, ZodTypeLike>;
		type?: ZodTypeLike;
		values?: readonly unknown[];
		checks?: Array<{ kind: string; value?: unknown }>;
		options?: ZodTypeLike[];
	};
	shape?: Record<string, ZodTypeLike>;
};

/**
 * Converts a Zod schema to a JSON Schema object.
 *
 * This enables the SDK to accept Zod schemas for structured output
 * validation and convert them to JSON Schema format for the CLI.
 *
 * Supported Zod types:
 * - Primitives: string, number, boolean, null, undefined
 * - Literals and enums
 * - Arrays and objects
 * - Optional, nullable, and default
 * - Union, intersection, record, tuple
 *
 * @param schema - A Zod schema or Zod-like object
 * @returns Equivalent JSON Schema object
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
export function zodToJsonSchema(schema: ZodTypeLike): JsonSchema {
	const def = schema._def;
	if (!def) {
		return {};
	}

	const typeName = def.typeName;

	switch (typeName) {
		case 'ZodString':
			return buildStringSchema(def);

		case 'ZodNumber':
			return buildNumberSchema(def);

		case 'ZodBoolean':
			return { type: 'boolean' };

		case 'ZodNull':
			return { type: 'null' };

		case 'ZodUndefined':
			return {};

		case 'ZodLiteral':
			return { const: def.values };

		case 'ZodEnum':
			return { type: 'string', enum: def.values as unknown[] };

		case 'ZodNativeEnum':
			return { type: 'string', enum: Object.values(def.values as object) };

		case 'ZodArray':
			return {
				type: 'array',
				items: def.type ? zodToJsonSchema(def.type) : {},
			};

		case 'ZodObject':
			return buildObjectSchema(schema, def);

		case 'ZodOptional':
			return def.innerType ? zodToJsonSchema(def.innerType) : {};

		case 'ZodNullable': {
			const inner = def.innerType ? zodToJsonSchema(def.innerType) : {};
			return { oneOf: [inner, { type: 'null' }] };
		}

		case 'ZodDefault':
			return def.innerType ? zodToJsonSchema(def.innerType) : {};

		case 'ZodUnion':
			return {
				oneOf: (def.options ?? []).map((opt) => zodToJsonSchema(opt)),
			};

		case 'ZodIntersection':
			return {
				allOf: [def.innerType ? zodToJsonSchema(def.innerType) : {}],
			};

		case 'ZodRecord':
			return {
				type: 'object',
				additionalProperties: def.type ? zodToJsonSchema(def.type) : true,
			};

		case 'ZodTuple':
			return { type: 'array' };

		case 'ZodAny':
		case 'ZodUnknown':
			return {};

		default:
			return {};
	}
}

/**
 * Builds a JSON Schema for a Zod string type.
 *
 * @param def - The Zod definition object
 * @returns JSON Schema for a string type
 *
 * @internal
 */
function buildStringSchema(def: ZodTypeLike['_def']): JsonSchema {
	const schema: JsonSchema = { type: 'string' };

	for (const check of def?.checks ?? []) {
		switch (check.kind) {
			case 'min':
				schema.minLength = check.value as number;
				break;
			case 'max':
				schema.maxLength = check.value as number;
				break;
			case 'length':
				schema.minLength = check.value as number;
				schema.maxLength = check.value as number;
				break;
			case 'email':
				schema.format = 'email';
				break;
			case 'url':
				schema.format = 'uri';
				break;
			case 'uuid':
				schema.format = 'uuid';
				break;
			case 'regex':
				schema.pattern = String(check.value);
				break;
		}
	}

	return schema;
}

/**
 * Builds a JSON Schema for a Zod number type.
 *
 * @param def - The Zod definition object
 * @returns JSON Schema for a number type
 *
 * @internal
 */
function buildNumberSchema(def: ZodTypeLike['_def']): JsonSchema {
	const schema: JsonSchema = { type: 'number' };

	for (const check of def?.checks ?? []) {
		switch (check.kind) {
			case 'min':
				schema.minimum = check.value as number;
				break;
			case 'max':
				schema.maximum = check.value as number;
				break;
			case 'int':
				schema.type = 'integer';
				break;
			case 'multipleOf':
				schema.multipleOf = check.value as number;
				break;
		}
	}

	return schema;
}

/**
 * Builds a JSON Schema for a Zod object type.
 *
 * @param schema - The Zod schema object
 * @param def - The Zod definition object
 * @returns JSON Schema for an object type
 *
 * @internal
 */
function buildObjectSchema(schema: ZodTypeLike, def: ZodTypeLike['_def']): JsonSchema {
	const shape = def?.shape?.() ?? schema.shape ?? {};
	const properties: Record<string, JsonSchema> = {};
	const required: string[] = [];

	for (const [key, value] of Object.entries(shape)) {
		properties[key] = zodToJsonSchema(value as ZodTypeLike);

		const valueDef = (value as ZodTypeLike)._def;
		const isOptional = valueDef?.typeName === 'ZodOptional' || valueDef?.typeName === 'ZodDefault';

		if (!isOptional) {
			required.push(key);
		}
	}

	return {
		type: 'object',
		properties,
		required: required.length > 0 ? required : undefined,
		additionalProperties: false,
	};
}

/**
 * Type guard to check if a value is a Zod schema.
 *
 * @param value - Value to check
 * @returns True if the value appears to be a Zod schema
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
export function isZodSchema(value: unknown): value is ZodTypeLike {
	return (
		typeof value === 'object' &&
		value !== null &&
		'_def' in value &&
		typeof (value as ZodTypeLike)._def === 'object'
	);
}
