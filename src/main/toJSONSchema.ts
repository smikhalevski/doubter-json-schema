import {
  AnyShape,
  ArrayShape,
  BigIntShape,
  BooleanShape,
  CatchShape,
  Check,
  ConstShape,
  DateShape,
  EnumShape,
  ExcludeShape,
  InstanceShape,
  IntersectionShape,
  JSONShape,
  LazyShape,
  MapShape,
  NeverShape,
  NumberShape,
  ObjectShape,
  PipeShape,
  PromiseShape,
  RecordShape,
  ReplaceShape,
  SetShape,
  Shape,
  StringShape,
  SymbolShape,
  TransformShape,
  UnionShape,
} from 'doubter';
import { Dict, JSONSchema } from './types';

export interface JSONSchemaOptions {
  definitions?: Dict<AnyShape>;
  dialect?: string;
}

export function toJSONSchema(shape: AnyShape, options?: JSONSchemaOptions): JSONSchema;

export function toJSONSchema(shapes: Dict<AnyShape>, options?: JSONSchemaOptions): JSONSchema;

export function toJSONSchema(source: AnyShape | Dict<AnyShape>, options: JSONSchemaOptions = {}) {
  const { definitions, dialect = 'https://json-schema.org/draft/2020-12/schema' } = options;

  const context = new ConversionContext(definitions);

  if (source instanceof Shape) {
    const schema = context.get(source);

    if (context.definitions !== undefined) {
      schema.definitions = context.definitions;
    }

    schema.$schema = dialect;

    return schema;
  }

  const schemas: Dict<JSONSchema> = {};

  for (const name in source) {
    schemas[name] = context.get(source[name]);
  }

  return {
    $schema: dialect,
    definitions: Object.assign(schemas, context.definitions),
  };
}

export class ConversionContext {
  names?: Map<AnyShape, string>;
  definitions?: Dict<JSONSchema>;

  constructor(definitions: Dict<AnyShape> | undefined) {
    if (definitions === undefined) {
      return;
    }

    this.names = new Map();
    this.definitions = {};

    for (const name in definitions) {
      this.names.set(definitions[name], name);
    }
    for (const name in definitions) {
      this.definitions[name] = convertShape(definitions[name], this);
    }
  }

  get(shape: AnyShape): JSONSchema {
    const name = this.names?.get(shape);

    if (name !== undefined) {
      return { $ref: '#/definitions/' + name };
    }
    return convertShape(shape, this);
  }
}

function convertShape(shape: AnyShape, context: ConversionContext): JSONSchema {
  if (!(shape instanceof Shape)) {
    throw new Error('Expected a shape');
  }

  if (shape instanceof TransformShape || shape instanceof CatchShape || shape instanceof LazyShape) {
    return context.get(shape.shape);
  } else if (shape instanceof PipeShape) {
    return context.get(shape.inputShape);
  }

  let schema: JSONSchema;

  if (shape instanceof ReplaceShape) {
    schema = convertReplaceShape(shape, context);
  } else if (shape instanceof ExcludeShape) {
    schema = convertExcludeShape(shape, context);
  } else if (shape instanceof NumberShape) {
    schema = convertNumberShape(shape);
  } else if (shape instanceof NeverShape) {
    schema = { not: {} };
  } else if (shape instanceof BigIntShape) {
    schema = { type: 'integer', format: 'int64' };
  } else if (shape instanceof StringShape) {
    schema = convertStringShape(shape);
  } else if (shape instanceof JSONShape) {
    schema = { type: 'string', format: 'json' };
  } else if (shape instanceof EnumShape) {
    schema = { enum: shape.values.slice(0) };
  } else if (shape instanceof UnionShape) {
    schema = { anyOf: convertShapes(shape.shapes, context) };
  } else if (shape instanceof ObjectShape) {
    schema = convertObjectShape(shape, context);
  } else if (shape instanceof RecordShape) {
    schema = convertRecordShape(shape, context);
  } else if (shape instanceof ConstShape) {
    schema = convertConstShape(shape);
  } else if (shape instanceof BooleanShape) {
    schema = { type: 'boolean' };
  } else if (shape instanceof PromiseShape) {
    schema = { type: 'object' };
  } else if (shape instanceof ArrayShape) {
    schema = convertArrayShape(shape, context);
  } else if (shape instanceof SetShape) {
    schema = convertSetShape(shape, context);
  } else if (shape instanceof MapShape) {
    schema = convertMapShape(shape, context);
  } else if (shape instanceof DateShape) {
    schema = { type: 'string', format: 'date-time' };
  } else if (shape instanceof IntersectionShape) {
    schema = { allOf: convertShapes(shape.shapes, context) };
  } else if (shape instanceof InstanceShape) {
    schema = { type: 'object' };
  } else if (shape instanceof SymbolShape) {
    throw new Error('Symbols cannot be represented in a JSON schema');
  } else {
    schema = {};
  }

  if (shape.description !== '') {
    schema.description = shape.description;
  }

  return schema;
}

function convertShapes(shapes: AnyShape[], context: ConversionContext): Array<JSONSchema> {
  const schemas = [];

  for (const shape of shapes) {
    schemas.push(context.get(shape));
  }
  return schemas;
}

function convertReplaceShape(shape: ReplaceShape<AnyShape, unknown, unknown>, context: ConversionContext): JSONSchema {
  return {
    oneOf: [
      shape.inputValue === null || shape.inputValue === undefined ? { type: 'null' } : { const: shape.inputValue },
      context.get(shape.shape),
    ],
  };
}

function convertExcludeShape(shape: ExcludeShape<AnyShape, unknown>, context: ConversionContext): JSONSchema {
  const schema = context.get(shape.shape);

  schema.not = { const: shape.excludedValue };

  return schema;
}

function convertConstShape(shape: ConstShape<unknown>): JSONSchema {
  if (shape.value === null || shape.value === undefined) {
    return { type: 'null' };
  }
  return { const: shape.value };
}

function convertArrayShape(
  shape: ArrayShape<AnyShape[] | null, AnyShape | null>,
  context: ConversionContext
): JSONSchema {
  const schema: JSONSchema = { type: 'array' };

  schema.items = shape.restShape !== null ? context.get(shape.restShape) : false;

  if (shape.shapes !== null && shape.shapes.length !== 0) {
    schema.prefixItems = convertShapes(shape.shapes, context);
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

function convertSetShape(shape: SetShape<AnyShape>, context: ConversionContext): JSONSchema {
  const schema: JSONSchema = { type: 'array', uniqueItems: true };

  schema.items = context.get(shape.shape);

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

function convertMapShape(shape: MapShape<AnyShape, AnyShape>, context: ConversionContext): JSONSchema {
  return {
    type: 'array',
    items: {
      type: 'array',
      prefixItems: [context.get(shape.keyShape), context.get(shape.valueShape)],
      items: false,
    },
  };
}

function convertObjectShape(
  shape: ObjectShape<Dict<AnyShape>, AnyShape | null>,
  context: ConversionContext
): JSONSchema {
  let properties: Dict<JSONSchema> | undefined;
  let required: string[] | undefined;

  const schema: JSONSchema = { type: 'object' };

  for (const key of shape.keys) {
    let valueShape = shape.shapes[key];

    if (valueShape['_getInputTypes']().includes('undefined')) {
      const nonOptionalValueShape = valueShape.nonOptional();

      if (!(nonOptionalValueShape instanceof ExcludeShape)) {
        valueShape = nonOptionalValueShape;
      }
    } else {
      (required ||= []).push(key);
    }

    (properties ||= {})[key] = context.get(valueShape);
  }

  if (properties !== undefined) {
    schema.properties = properties;
  }
  if (required !== undefined) {
    schema.required = required;
  }

  if (shape.restShape !== null) {
    schema.additionalProperties = context.get(shape.restShape);
  } else if (shape.keysMode === 'exact') {
    schema.additionalProperties = false;
  }

  return schema;
}

function convertNumberShape(shape: NumberShape): JSONSchema {
  const schema: JSONSchema = {
    type: shape['_typePredicate'] === Number.isInteger ? 'integer' : 'number',
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

  check = shape.getCheck('stringRegex');
  if (check !== undefined) {
    schema.pattern = (check.param as RegExp).source;
  }

  return schema;
}

function convertRecordShape(
  shape: RecordShape<Shape<string, PropertyKey> | null, AnyShape>,
  context: ConversionContext
): JSONSchema {
  const schema: JSONSchema = { additionalProperties: context.get(shape.valueShape) };

  if (shape.keyShape !== null) {
    schema.propertyNames = context.get(shape.keyShape);
  }
  return schema;
}
