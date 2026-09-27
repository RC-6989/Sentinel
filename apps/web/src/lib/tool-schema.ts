import Ajv, { type ValidateFunction } from "ajv";

export class ToolInputError extends Error {}

// A bounded draft-07 subset: no references, regexes, formats, or combinators.
// Schemas are tenant input, so reject expensive/unsupported features explicitly.
const keywords = new Set([
  "$schema", "title", "description", "type", "properties", "required",
  "additionalProperties", "items", "enum", "const", "minLength", "maxLength",
  "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum",
  "minItems", "maxItems", "minProperties", "maxProperties",
]);
const validators = new Map<string, ValidateFunction>();

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseJson(text: string, label: string, maxBytes: number): unknown {
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new ToolInputError(`${label} must be at most ${maxBytes / 1024} KiB.`);
  }
  let value: unknown;
  try { value = JSON.parse(text); }
  catch { throw new ToolInputError(`${label} must be valid JSON.`); }
  let nodes = 0;
  function inspect(node: unknown, depth: number) {
    if (++nodes > 4096 || depth > 20) throw new ToolInputError(`${label} is too complex.`);
    if (typeof node === "number" && !Number.isFinite(node)) throw new ToolInputError(`${label} contains a non-finite number.`);
    if (node !== null && typeof node === "object") {
      for (const child of Object.values(node)) inspect(child, depth + 1);
    }
  }
  inspect(value, 0);
  return value;
}

function compileSchema(text: string) {
  const cached = validators.get(text);
  if (cached) return cached;
  const schema = parseJson(text, "Schema", 16 * 1024);
  if (!object(schema) || schema.type !== "object") {
    throw new ToolInputError('Input schema must have a root type of "object".');
  }
  let nodes = 0;
  function inspect(node: unknown, depth: number) {
    if (++nodes > 128 || depth > 8) throw new ToolInputError("Schema is too complex (maximum depth 8 and 128 schema nodes).");
    if (typeof node === "boolean") return;
    if (!object(node)) throw new ToolInputError("Each schema must be an object or boolean.");
    for (const key of Object.keys(node)) {
      if (!keywords.has(key)) throw new ToolInputError(`Unsupported schema keyword: ${key.slice(0, 80)}.`);
    }
    if ("$schema" in node && (depth !== 0 || node.$schema !== "http://json-schema.org/draft-07/schema#")) {
      throw new ToolInputError("Only JSON Schema draft-07 is supported, declared at the root.");
    }
    if ("properties" in node) {
      if (!object(node.properties)) throw new ToolInputError("Schema properties must be an object.");
      // Ajv intentionally skips this property; accepting it would silently drop
      // a user-specified constraint. Reject it rather than claiming validation.
      if (Object.hasOwn(node.properties, "__proto__")) throw new ToolInputError('Schema property "__proto__" is not supported.');
      for (const child of Object.values(node.properties)) inspect(child, depth + 1);
    }
    if ("items" in node) inspect(node.items, depth + 1);
    if ("additionalProperties" in node) inspect(node.additionalProperties, depth + 1);
  }
  inspect(schema, 0);
  let validate: ValidateFunction;
  try {
    // A fresh compiler avoids retaining arbitrary tenant schemas in Ajv's cache.
    validate = new Ajv({ strict: true, allErrors: false, ownProperties: true }).compile(schema);
  } catch {
    throw new ToolInputError("Invalid schema. Check keyword types, required properties, and type-specific constraints.");
  }
  if (validators.size >= 32) validators.delete(validators.keys().next().value!);
  validators.set(text, validate);
  return validate;
}

export function normalizeToolSchema(text: string): string {
  compileSchema(text);
  return JSON.stringify(JSON.parse(text));
}

export type InputValidation = { valid: boolean; errors: string[] };

export function validateToolInput(schemaText: string, inputText: string): InputValidation {
  const validate = compileSchema(schemaText);
  const input = parseJson(inputText, "Input", 64 * 1024);
  const valid = validate(input) as boolean;
  return {
    valid,
    // Never return the submitted data or embed it in audit logs.
    errors: valid ? [] : (validate.errors ?? []).map(error => `${error.instancePath || "/"}: ${error.message}`),
  };
}
