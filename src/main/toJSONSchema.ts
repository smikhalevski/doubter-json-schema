import {
  AnyShape,
  ArrayShape,
  BigIntShape,
  BooleanShape,
  CatchShape,
  Check,
  ConstShape,
  DateShape,
  DenyLiteralShape,
  EnumShape,
  ExcludeShape,
  InstanceShape,
  IntersectionShape,
  LazyShape,
  MapShape,
  NeverShape,
  NumberShape,
  ObjectShape,
  PipeShape,
  PromiseShape,
  RecordShape,
  ReplaceLiteralShape,
  SetShape,
  Shape,
  StringShape,
  TransformShape,
  UnionShape,
} from 'doubter';
import { Dict, JSONSchema } from './types';

export interface JSONSchemaOptions {
  /**
   * The mapping from the definition name to a shape that is converted to the JSON schema.
   */
  definitions?: Dict<AnyShape>;

  /**
   * The key under which the definitions are stored.
   *
   * @default 'definitions'
   */
  definitionsKey?: string;

  /**
   * The schema base path.
   *
   * @default '#'
   */
  basePath?: string[];

  /**
   * The schema dialect placed in `$schema`.
   *
   * @default 'https://json-schema.org/draft/2020-12/schema'
   */
  dialect?: string;

  /**
   * If `true` then definitions from {@linkcode definitions} that aren't referenced, are still rendered under
   * {@linkcode definitionsKey}. Otherwise, those definitions aren't rendered.
   */
  unusedDefinitions?: boolean;
}

/**
 * Converts the shape to a JSON schema.
 *
 * @param shape The shape to convert.
 * @param options The JSON schema options.
 */
export function toJSONSchema(shape: AnyShape, options?: JSONSchemaOptions): JSONSchema;

/**
 * Converts definitions to a JSON schema.
 *
 * @param shapes The mapping from a shape name to shape.
 * @param options The JSON schema options.
 */
export function toJSONSchema(shapes: Dict<AnyShape>, options?: JSONSchemaOptions): JSONSchema;

export function toJSONSchema(source: AnyShape | Dict<AnyShape>, options: JSONSchemaOptions = {}) {
  const {
    definitions,
    definitionsKey = 'definitions',
    basePath = ['#'],
    unusedDefinitions,
    dialect = 'https://json-schema.org/draft/2020-12/schema',
  } = options;

  const converter = new Converter(basePath.join('/') + '/' + definitionsKey + '/');

  if (definitions !== undefined) {
    for (const name in definitions) {
      converter.addDefinition(name, definitions[name]);
    }
  }

  let schema: JSONSchema;

  if (source instanceof Shape) {
    schema = converter.convert(source);
  } else {
    schema = {};

    for (const name in source) {
      converter.addDefinition(name, source[name]);
    }
    for (const name in source) {
      converter.convert(source[name]);
    }
  }

  if (definitions !== undefined && unusedDefinitions) {
    for (const name in definitions) {
      converter.convert(definitions[name]);
    }
  }

  let results: Dict | undefined;

  converter.results.forEach(result => {
    (results ||= {})[result.name] = result.schema;
  });

  if (results !== undefined) {
    schema[definitionsKey] = results;
  }

  schema.$schema = dialect;

  return schema;
}

class Converter {
  /**
   * The named conversion results.
   */
  readonly results = new Map<AnyShape, { schema: JSONSchema | null; name: any }>();

  /**
   * Map from a shape to a definition name.
   */
  protected _definitions = new Map<AnyShape, string>();

  /**
   * The stack of shapes to detect the cyclic shapes dependencies.
   */
  protected _stack = new Set<AnyShape>();

  /**
   * Occupied dependency names.
   */
  protected _names = new Set<string>();

  /**
   * The suffix added to dependency names created for cyclic shapes that aren't among definitions.
   */
  protected _namelessCounter = 0;

  /**
   * @param definitionsPath The path prefix for schema references.
   */
  constructor(readonly definitionsPath: string) {}

  /**
   * Adds or replaces a definition.
   */
  addDefinition(name: string, shape: AnyShape): void {
    this._definitions.set(shape, name);
    this._names.add(name);
  }

  convert(shape: AnyShape): JSONSchema {
    const { results, definitionsPath, _stack, _names } = this;

    let result = results.get(shape);
    let name = this._definitions.get(shape);

    if (name !== undefined) {
      // Definition

      if (result !== undefined) {
        return { $ref: definitionsPath + name };
      }

      result = { schema: null, name };

      results.set(shape, result);
    } else if (_stack.has(shape)) {
      // Cyclic dependency

      if (result !== undefined) {
        return { $ref: definitionsPath + result.name };
      }

      do {
        name = 'shape' + ++this._namelessCounter;
      } while (_names.has(name));

      _names.add(name);

      result = { schema: null, name };

      results.set(shape, result);

      return { $ref: definitionsPath + name };
    }

    _stack.add(shape);

    const schema = convertShape(shape, this);

    _stack.delete(shape);

    result ??= results.get(shape);

    if (result !== undefined) {
      result.schema = schema;

      return { $ref: definitionsPath + result.name };
    }

    return schema;
  }
}

function convertShape(shape: AnyShape, converter: Converter): JSONSchema {
  if (!(shape instanceof Shape)) {
    throw new Error('Expected a shape');
  }

  if (shape instanceof TransformShape) {
  } else if (shape instanceof CatchShape || shape instanceof LazyShape) {
    return converter.convert(shape.shape);
  } else if (shape instanceof PipeShape) {
    return converter.convert(shape.inputShape);
  }

  let schema: JSONSchema;

  if (shape instanceof ReplaceLiteralShape) {
    schema = convertReplaceLiteralShape(shape, converter);
  } else if (shape instanceof DenyLiteralShape) {
    schema = convertDenyLiteralShape(shape, converter);
  } else if (shape instanceof ExcludeShape) {
    schema = convertExcludeShape(shape, converter);
  } else if (shape instanceof NumberShape) {
    schema = convertNumberShape(shape);
  } else if (shape instanceof NeverShape) {
    schema = { not: {} };
  } else if (shape instanceof BigIntShape) {
    schema = { type: 'integer', format: 'int64' };
  } else if (shape instanceof StringShape) {
    schema = convertStringShape(shape);
  } else if (shape instanceof EnumShape) {
    schema = { enum: shape.values.slice(0) };
  } else if (shape instanceof UnionShape) {
    schema = { anyOf: convertShapes(shape.shapes, converter) };
  } else if (shape instanceof ObjectShape) {
    schema = convertObjectShape(shape, converter);
  } else if (shape instanceof RecordShape) {
    schema = convertRecordShape(shape, converter);
  } else if (shape instanceof ConstShape) {
    schema = convertConstShape(shape);
  } else if (shape instanceof BooleanShape) {
    schema = { type: 'boolean' };
  } else if (shape instanceof PromiseShape) {
    schema = { type: 'object' };
  } else if (shape instanceof ArrayShape) {
    schema = convertArrayShape(shape, converter);
  } else if (shape instanceof SetShape) {
    schema = convertSetShape(shape, converter);
  } else if (shape instanceof MapShape) {
    schema = convertMapShape(shape, converter);
  } else if (shape instanceof DateShape) {
    schema = { type: 'string', format: 'date-time' };
  } else if (shape instanceof IntersectionShape) {
    schema = { allOf: convertShapes(shape.shapes, converter) };
  } else if (shape instanceof InstanceShape) {
    schema = { type: 'object' };
  } else {
    schema = {};
  }

  if (typeof shape.annotations.description === 'string') {
    schema.description = shape.annotations.description;
  }

  return schema;
}

function convertShapes(shapes: AnyShape[], converter: Converter): Array<JSONSchema> {
  const schemas = [];

  for (const shape of shapes) {
    schemas.push(converter.convert(shape));
  }
  return schemas;
}

function convertReplaceLiteralShape(
  shape: ReplaceLiteralShape<AnyShape, unknown, unknown>,
  converter: Converter
): JSONSchema {
  if (shape.inputValue === undefined) {
    return converter.convert(shape.shape);
  }

  return {
    oneOf: [shape.inputValue === null ? { type: 'null' } : { const: shape.inputValue }, converter.convert(shape.shape)],
  };
}

function convertDenyLiteralShape(shape: DenyLiteralShape<AnyShape, unknown>, converter: Converter): JSONSchema {
  const schema = converter.convert(shape.shape);

  schema.not = { const: shape.deniedValue };

  return schema;
}

function convertExcludeShape(shape: ExcludeShape<AnyShape, AnyShape>, converter: Converter): JSONSchema {
  const schema = converter.convert(shape.shape);

  schema.not = converter.convert(shape.excludedShape);

  return schema;
}

function convertConstShape(shape: ConstShape<unknown>): JSONSchema {
  if (shape.value === null || shape.value === undefined) {
    return { type: 'null' };
  }
  return { const: shape.value };
}

function convertArrayShape(shape: ArrayShape<AnyShape[] | null, AnyShape | null>, converter: Converter): JSONSchema {
  const schema: JSONSchema = { type: 'array' };

  schema.items = shape.restShape !== null ? converter.convert(shape.restShape) : false;

  if (shape.shapes !== null && shape.shapes.length !== 0) {
    schema.prefixItems = convertShapes(shape.shapes, converter);
  }

  let check: Check | undefined;

  check = shape.getCheck('arrayMinLength');
  if (check !== undefined) {
    schema.minItems = check.param;
  }

  check = shape.getCheck('arrayMaxLength');
  if (check !== undefined) {
    schema.maxItems = check.param;
  }

  return schema;
}

function convertSetShape(shape: SetShape<AnyShape>, converter: Converter): JSONSchema {
  const schema: JSONSchema = { type: 'array', uniqueItems: true };

  schema.items = converter.convert(shape.shape);

  let check: Check | undefined;

  check = shape.getCheck('setMinSize');
  if (check !== undefined) {
    schema.minItems = check.param;
  }

  check = shape.getCheck('setMaxSize');
  if (check !== undefined) {
    schema.maxItems = check.param;
  }

  return schema;
}

function convertMapShape(shape: MapShape<AnyShape, AnyShape>, converter: Converter): JSONSchema {
  return {
    type: 'array',
    items: {
      type: 'array',
      prefixItems: [converter.convert(shape.keyShape), converter.convert(shape.valueShape)],
      items: false,
    },
  };
}

function convertObjectShape(shape: ObjectShape<Dict<AnyShape>, AnyShape | null>, converter: Converter): JSONSchema {
  let properties: Dict<JSONSchema> | undefined;
  let required: string[] | undefined;

  const schema: JSONSchema = { type: 'object' };

  for (const key of shape.keys) {
    const valueShape = shape.shapes[key];

    if (!valueShape.accepts(undefined)) {
      (required ||= []).push(key);
    }

    (properties ||= {})[key] = converter.convert(valueShape);
  }

  if (properties !== undefined) {
    schema.properties = properties;
  }
  if (required !== undefined) {
    schema.required = required;
  }

  if (shape.restShape !== null) {
    schema.additionalProperties = converter.convert(shape.restShape);
  } else if (shape.keysMode === 'exact') {
    schema.additionalProperties = false;
  }

  return schema;
}

function convertNumberShape(shape: NumberShape): JSONSchema {
  const schema: JSONSchema = {
    type: shape.isInteger ? 'integer' : 'number',
  };

  let check: Check | undefined;

  check = shape.getCheck('numberMultipleOf');
  if (check !== undefined) {
    schema.multipleOf = check.param;
  }

  check = shape.getCheck('numberGreaterThanOrEqual');
  if (check !== undefined) {
    schema.minimum = check.param;
  }

  check = shape.getCheck('numberLessThanOrEqual');
  if (check !== undefined) {
    schema.maximum = check.param;
  }

  check = shape.getCheck('numberGreaterThan');
  if (check !== undefined) {
    schema.exclusiveMinimum = check.param;
  }

  check = shape.getCheck('numberLessThan');
  if (check !== undefined) {
    schema.exclusiveMaximum = check.param;
  }

  return schema;
}

function convertStringShape(shape: StringShape): JSONSchema {
  const schema: JSONSchema = { type: 'string' };

  let check: Check | undefined;

  check = shape.getCheck('stringMaxLength');
  if (check !== undefined) {
    schema.maxLength = check.param;
  }

  check = shape.getCheck('stringMinLength');
  if (check !== undefined) {
    schema.minLength = check.param;
  }

  return schema;
}

function convertRecordShape(
  shape: RecordShape<Shape<string, PropertyKey> | null, AnyShape>,
  converter: Converter
): JSONSchema {
  const schema: JSONSchema = { additionalProperties: converter.convert(shape.valueShape) };

  if (shape.keyShape !== null) {
    schema.propertyNames = converter.convert(shape.keyShape);
  }
  return schema;
}
