export interface Dict<T = any> {
  [key: string]: T;
}

/**
 * [Basic types in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/type.html)
 */
export type JSONSchemaType = 'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string';

/**
 * [JSON Schema Validation: A Vocabulary for Structural Validation of JSON](https://json-schema.org/draft/2020-12/json-schema-validation.html)
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
   * [`$schema` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/schema.html#schema)
   */
  $schema?: string;

  /**
   * [`$id` in JSON schema spec](https://json-schema.org/understanding-json-schema/structuring.html#id)
   */
  $id?: string;

  /**
   * [`$ref` in JSON schema spec](https://json-schema.org/understanding-json-schema/structuring.html#ref)
   */
  $ref?: string;

  /**
   * [`type` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/type.html)
   */
  type?: JSONSchemaType | Array<JSONSchemaType>;

  /**
   * [`definitions` in JSON schema spec](https://json-schema.org/understanding-json-schema/structuring.html)
   */
  definitions?: Dict<JSONSchema | boolean>;

  [key: string]: any;
}

/**
 * [String keywords in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/string.html)
 */
export interface StringKeywords {
  /**
   * [`maxLength` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/string.html#length)
   */
  maxLength?: number;

  /**
   * [`minLength` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/string.html#length)
   */
  minLength?: number;

  /**
   * [`pattern` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/string.html#regular-expressions)
   */
  pattern?: string;

  /**
   * [`format` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/string.html#format)
   */
  format?: string;
}

/**
 * [Numeric keywords in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/numeric.html)
 */
export interface NumericKeywords {
  /**
   * [`multipleOf` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/numeric.html#multiples)
   */
  multipleOf?: number;

  /**
   * [`maximum` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/numeric.html#range)
   */
  maximum?: number;

  /**
   * [`minimum` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/numeric.html#range)
   */
  minimum?: number;

  /**
   * [`exclusiveMaximum` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/numeric.html#range)
   */
  exclusiveMaximum?: number;

  /**
   * [`exclusiveMinimum` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/numeric.html#range)
   */
  exclusiveMinimum?: number;
}

/**
 * [Object keywords in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/object.html)
 */
export interface ObjectKeywords {
  /**
   * [`properties` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/object.html#properties)
   */
  properties?: Dict<JSONSchema | boolean>;

  /**
   * [`patternProperties` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/object.html#pattern-properties)
   */
  patternProperties?: Dict<JSONSchema | boolean>;

  /**
   * [`additionalProperties` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/object.html#additional-properties)
   */
  additionalProperties?: JSONSchema | boolean;

  /**
   * [`unevaluatedProperties` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/object.html#unevaluated-properties)
   */
  unevaluatedProperties?: JSONSchema | boolean;

  /**
   * [`required` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/object.html#required-properties)
   */
  required?: string[];

  /**
   * [`propertyNames` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/object.html#property-names)
   */
  propertyNames?: JSONSchema | boolean;

  /**
   * [`maxProperties` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/object.html#size)
   */
  maxProperties?: number;

  /**
   * [`minProperties` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/object.html#size)
   */
  minProperties?: number;
}

/**
 * [Array keywords in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/array.html)
 */
export interface ArrayKeywords {
  /**
   * [`items` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/array.html#items)
   */
  items?: JSONSchema | boolean | Array<JSONSchema | boolean>;

  /**
   * [`prefixItems` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/array.html#tuple-validation)
   */
  prefixItems?: Array<JSONSchema | boolean>;

  /**
   * @deprecated
   * [`additionalItems` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/array.html#additional-items)
   */
  additionalItems?: JSONSchema | boolean;

  /**
   * [`unevaluatedItems` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/array.html#unevaluated-items)
   */
  unevaluatedItems?: JSONSchema | boolean;

  /**
   * [`minItems` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/array.html#length)
   */
  minItems?: number;

  /**
   * [`maxItems` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/array.html#length)
   */
  maxItems?: number;

  /**
   * [`contains` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/array.html#contains)
   */
  contains?: JSONSchema | boolean;

  /**
   * [`minContains` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/array.html#mincontains-maxcontains)
   */
  minContains?: number;

  /**
   * [`maxContains` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/array.html#mincontains-maxcontains)
   */
  maxContains?: number;

  /**
   * [`uniqueItems` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/array.html#uniqueness)
   */
  uniqueItems?: boolean;
}

/**
 * [Media: string-encoding non-JSON data in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/non_json_data.html)
 */
export interface MediaJKeywords {
  /**
   * [`contentEncoding` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/non_json_data.html#contentencoding)
   */
  contentEncoding?: string;

  /**
   * [`contentMediaType` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/non_json_data.html#contentmediatype)
   */
  contentMediaType?: string;

  /**
   * [`contentSchema` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/non_json_data.html#contentschema)
   */
  contentSchema?: JSONSchema | boolean;
}

/**
 * [Schema Composition keywords in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/combining.html)
 */
export interface CompositionKeywords {
  /**
   * [`allOf` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/combining.html#allof)
   */
  allOf?: Array<JSONSchema | boolean>;

  /**
   * [`anyOf` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/combining.html#anyof)
   */
  anyOf?: Array<JSONSchema | boolean>;

  /**
   * [`oneOf` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/combining.html#oneof)
   */
  oneOf?: Array<JSONSchema | boolean>;

  /**
   * [`not` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/combining.html#not)
   */
  not?: JSONSchema | boolean;
}

/**
 * [Applying Subschemas Conditionally in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/conditionals.html)
 */
export interface ConditionKeywords {
  /**
   * [`dependentRequired` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/conditionals.html#dependentrequired)
   */
  dependentRequired?: Dict<JSONSchema | string[] | boolean>;

  /**
   * [`dependentSchemas` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/conditionals.html#dependentschemas)
   */
  dependentSchemas?: Dict<JSONSchema | boolean>;

  /**
   * [`if` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/conditionals.html#if-then-else)
   */
  if?: JSONSchema | boolean;

  /**
   * [`then` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/conditionals.html#if-then-else)
   */
  then?: JSONSchema | boolean;

  /**
   * [`else` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/conditionals.html#if-then-else)
   */
  else?: JSONSchema | boolean;
}

/**
 * [Generic  keywords in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/generic.html)
 */
export interface GenericKeywords {
  /**
   * [`enum` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#enumerated-values)
   */
  enum?: any[];

  /**
   * [`const` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#constant-values)
   */
  const?: any;

  /**
   * [`title` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#annotations)
   */
  title?: string;

  /**
   * [`description` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#annotations)
   */
  description?: string;

  /**
   * [`default` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#annotations)
   */
  default?: any;

  /**
   * [`readOnly` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#annotations)
   */
  readOnly?: boolean;

  /**
   * [`writeOnly` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#annotations)
   */
  writeOnly?: boolean;

  /**
   * [`examples` in JSON schema spec](https://json-schema.org/understanding-json-schema/reference/generic.html?highlight=enum#annotations)
   */
  examples?: any[];
}
