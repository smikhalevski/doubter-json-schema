export interface Dict<T = any> {
  [key: string]: T;
}

/**
 * @see {@link https://json-schema.org/understanding-json-schema/reference/type.html Basic types}
 */
export type JSONSchemaType = 'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string';

/**
 * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation.html JSON Schema Validation: A Vocabulary for Structural Validation of JSON}
 */
export interface JSONSchema
  extends StringKeywords,
    NumericKeywords,
    ObjectKeywords,
    ArrayKeywords,
    MediaJKeywords,
    CompositionKeywords,
    ConditionKeywords,
    GenericKeywords {
  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/schema.html#schema $schema}
   */
  $schema?: string;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/structuring.html#id $id}
   */
  $id?: string;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/structuring.html#ref $ref}
   */
  $ref?: string;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/type.html type}
   */
  type?: JSONSchemaType | Array<JSONSchemaType>;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/structuring.html definitions}
   */
  definitions?: Dict<JSONSchema | boolean>;

  [key: string]: any;
}

/**
 * @see {@link https://json-schema.org/understanding-json-schema/reference/string.html String}
 */
export interface StringKeywords {
  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/string.html#length maxLength}
   */
  maxLength?: number;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/string.html#length minLength}
   */
  minLength?: number;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/string.html#regular-expressions pattern}
   */
  pattern?: string;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/string.html#format format}
   */
  format?: string;
}

/**
 * @see {@link https://json-schema.org/understanding-json-schema/reference/numeric.html Numeric}
 */
export interface NumericKeywords {
  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/numeric.html#multiples multipleOf}
   */
  multipleOf?: number;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/numeric.html#range maximum}
   */
  maximum?: number;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/numeric.html#range minimum}
   */
  minimum?: number;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/numeric.html#range exclusiveMaximum}
   */
  exclusiveMaximum?: number;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/numeric.html#range exclusiveMinimum}
   */
  exclusiveMinimum?: number;
}

/**
 * @see {@link https://json-schema.org/understanding-json-schema/reference/object.html Object}
 */
export interface ObjectKeywords {
  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/object.html#properties properties}
   */
  properties?: Dict<JSONSchema | boolean>;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/object.html#pattern-properties patternProperties}
   */
  patternProperties?: Dict<JSONSchema | boolean>;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/object.html#additional-properties additionalProperties}
   */
  additionalProperties?: JSONSchema | boolean;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/object.html#unevaluated-properties unevaluatedProperties}
   */
  unevaluatedProperties?: JSONSchema | boolean;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/object.html#required-properties required}
   */
  required?: string[];

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/object.html#property-names propertyNames}
   */
  propertyNames?: JSONSchema | boolean;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/object.html#size maxProperties}
   */
  maxProperties?: number;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/object.html#size minProperties}
   */
  minProperties?: number;
}

/**
 * @see {@link https://json-schema.org/understanding-json-schema/reference/array.html Array}
 */
export interface ArrayKeywords {
  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/array.html#items items}
   */
  items?: JSONSchema | boolean | Array<JSONSchema | boolean>;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/array.html#tuple-validation prefixItems}
   */
  prefixItems?: Array<JSONSchema | boolean>;

  /**
   * @deprecated
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/array.html#additional-items additionalItems}
   */
  additionalItems?: JSONSchema | boolean;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/array.html#unevaluated-items unevaluatedItems}
   */
  unevaluatedItems?: JSONSchema | boolean;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/array.html#length minItems}
   */
  minItems?: number;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/array.html#length maxItems}
   */
  maxItems?: number;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/array.html#contains contains}
   */
  contains?: JSONSchema | boolean;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/array.html#mincontains-maxcontains minContains}
   */
  minContains?: number;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/array.html#mincontains-maxcontains maxContains}
   */
  maxContains?: number;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/array.html#uniqueness uniqueItems}
   */
  uniqueItems?: boolean;
}

/**
 * @see {@link https://json-schema.org/understanding-json-schema/reference/non_json_data.html Media: string-encoding non-JSON data}
 */
export interface MediaJKeywords {
  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/non_json_data.html#contentencoding contentEncoding}
   */
  contentEncoding?: string;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/non_json_data.html#contentmediatype contentMediaType}
   */
  contentMediaType?: string;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/non_json_data.html#contentschema contentSchema}
   */
  contentSchema?: JSONSchema | boolean;
}

/**
 * @see {@link https://json-schema.org/understanding-json-schema/reference/combining.html Schema Composition}
 */
export interface CompositionKeywords {
  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/combining.html#allof allOf}
   */
  allOf?: Array<JSONSchema | boolean>;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/combining.html#anyof anyOf}
   */
  anyOf?: Array<JSONSchema | boolean>;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/combining.html#oneof oneOf}
   */
  oneOf?: Array<JSONSchema | boolean>;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/combining.html#not not}
   */
  not?: JSONSchema | boolean;
}

/**
 * @see {@link https://json-schema.org/understanding-json-schema/reference/conditionals.html Applying Subschemas Conditionally}
 */
export interface ConditionKeywords {
  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/conditionals.html#dependentrequired dependentRequired}
   */
  dependentRequired?: Dict<JSONSchema | string[] | boolean>;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/conditionals.html#dependentschemas dependentSchemas}
   */
  dependentSchemas?: Dict<JSONSchema | boolean>;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/conditionals.html#if-then-else if}
   */
  if?: JSONSchema | boolean;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/conditionals.html#if-then-else then}
   */
  then?: JSONSchema | boolean;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/conditionals.html#if-then-else else}
   */
  else?: JSONSchema | boolean;
}

/**
 * @see {@link https://json-schema.org/understanding-json-schema/reference/generic.html Generic keywords}
 */
export interface GenericKeywords {
  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#enumerated-values enum}
   */
  enum?: any[];

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#constant-values const}
   */
  const?: any;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#annotations title}
   */
  title?: string;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#annotations description}
   */
  description?: string;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#annotations default}
   */
  default?: any;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#annotations readOnly}
   */
  readOnly?: boolean;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#annotations writeOnly}
   */
  writeOnly?: boolean;

  /**
   * @see {@linkcode https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#annotations examples}
   */
  examples?: any[];
}
