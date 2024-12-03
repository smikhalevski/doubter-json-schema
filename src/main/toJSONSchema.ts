import {
  AnyShape,
  ArrayShape,
  BigIntShape,
  BooleanShape,
  CatchShape,
  ConstShape,
  ConvertShape,
  DateShape,
  DenyShape,
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
  ReplaceShape,
  SetShape,
  Shape,
  StringShape,
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
   * @default "definitions"
   */
  definitionsKey?: string;

  /**
   * The schema base path.
   *
   * @default "#"
   */
  basePath?: string;

  /**
   * The schema dialect placed in {@linkcode JSONSchema.$schema}.
   *
   * @default "https://json-schema.org/draft/2020-12/schema"
   */
  dialect?: string;

  /**
   * If `true` then definitions from {@linkcode definitions} that aren't referenced, are still rendered under
   * {@linkcode definitionsKey}. Otherwise, those definitions aren't rendered.
   */
  unusedDefinitions?: boolean;

  /**
   * Returns a shape {@linkcode JSONSchema.title title}.
   *
   * By default, a {@link doubter!Shape.annotations title annotation} value is used.
   */
  getTitle?: (shape: AnyShape) => string | undefined;

  /**
   * Returns a shape {@linkcode JSONSchema.description description}.
   *
   * By default, a {@link doubter!Shape.annotations description annotation} value is used.
   */
  getDescription?: (shape: AnyShape) => string | undefined;
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
    basePath = '#',
    unusedDefinitions,
    dialect = 'https://json-schema.org/draft/2020-12/schema',
    getTitle,
    getDescription,
  } = options;

  const converter = new Converter(basePath + '/' + definitionsKey + '/', getTitle, getDescription);

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
   * @param getTitle Returns a shape title
   * @param getDescription Returns a shape description
   */
  constructor(
    readonly definitionsPath: string,
    readonly getTitle = getShapeTitle,
    readonly getDescription = getShapeDescription
  ) {}

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

  if (shape instanceof ConvertShape) {
  } else if (shape instanceof CatchShape) {
    return converter.convert(shape.baseShape);
  } else if (shape instanceof LazyShape) {
    return converter.convert(shape.providedShape);
  } else if (shape instanceof PipeShape) {
    return converter.convert(shape.inputShape);
  }

  let schema: JSONSchema;

  if (shape instanceof ReplaceShape) {
    schema = convertReplaceShape(shape, converter);
  } else if (shape instanceof DenyShape) {
    schema = convertDenyShape(shape, converter);
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

  const title = converter.getTitle(shape);
  const description = converter.getDescription(shape);

  if (title !== undefined) {
    schema.title = title;
  }
  if (description !== undefined) {
    schema.description = description;
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

function convertReplaceShape(shape: ReplaceShape<AnyShape, unknown, unknown>, converter: Converter): JSONSchema {
  if (shape.inputValue === undefined) {
    return converter.convert(shape.baseShape);
  }

  return {
    oneOf: [
      shape.inputValue === null ? { type: 'null' } : { const: shape.inputValue },
      converter.convert(shape.baseShape),
    ],
  };
}

function convertDenyShape(shape: DenyShape<AnyShape, unknown>, converter: Converter): JSONSchema {
  const schema = converter.convert(shape.baseShape);

  schema.not = { const: shape.deniedValue };

  return schema;
}

function convertExcludeShape(shape: ExcludeShape<AnyShape, AnyShape>, converter: Converter): JSONSchema {
  const schema = converter.convert(shape.baseShape);

  schema.not = converter.convert(shape.excludedShape);

  return schema;
}

function convertConstShape(shape: ConstShape<unknown>): JSONSchema {
  if (shape.value === null || shape.value === undefined) {
    return { type: 'null' };
  }
  return { const: shape.value };
}

function convertArrayShape(shape: ArrayShape<AnyShape[], AnyShape | null>, converter: Converter): JSONSchema {
  const schema: JSONSchema = { type: 'array' };

  schema.items = shape.restShape !== null ? converter.convert(shape.restShape) : false;

  if (shape.headShapes !== null && shape.headShapes.length !== 0) {
    schema.prefixItems = convertShapes(shape.headShapes, converter);
  }

  for (const { type, param } of shape.operations) {
    switch (type) {
      case 'array.max':
        if (schema.maxItems === undefined || param < schema.maxItems) {
          schema.maxItems = param;
        }
        break;

      case 'array.min':
        if (schema.minItems === undefined || param > schema.minItems) {
          schema.minItems = param;
        }
        break;

      case 'array.includes':
        const paramSchema = param instanceof Shape ? convertShape(shape, converter) : { const: param };

        if (schema.contains === undefined) {
          schema.contains = paramSchema;
        } else {
          (schema.allOf ||= []).push({ type: 'array', contains: paramSchema });
        }
        break;
    }
  }

  return schema;
}

function convertSetShape(shape: SetShape<AnyShape>, converter: Converter): JSONSchema {
  const schema: JSONSchema = { type: 'array', uniqueItems: true };

  schema.items = converter.convert(shape.valueShape);

  for (const { type, param } of shape.operations) {
    switch (type) {
      case 'set.max':
        if (schema.maxItems === undefined || param < schema.maxItems) {
          schema.maxItems = param;
        }
        break;

      case 'set.min':
        if (schema.minItems === undefined || param > schema.minItems) {
          schema.minItems = param;
        }
        break;
    }
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
    const valueShape = shape.propShapes[key];

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
  const schema: JSONSchema = { type: 'number' };

  for (const { type, param } of shape.operations) {
    switch (type) {
      case 'number.int':
        schema.type = 'integer';
        break;

      case 'number.lte':
        if (schema.maximum === undefined || param > schema.maximum) {
          schema.maximum = param;
        }
        break;

      case 'number.gte':
        if (schema.minimum === undefined || param < schema.minimum) {
          schema.minimum = param;
        }
        break;

      case 'number.lt':
        if (schema.exclusiveMaximum === undefined || param > schema.exclusiveMaximum) {
          schema.exclusiveMaximum = param;
        }
        break;

      case 'number.gt':
        if (schema.exclusiveMinimum === undefined || param < schema.exclusiveMinimum) {
          schema.exclusiveMinimum = param;
        }
        break;

      case 'number.multipleOf':
        schema.multipleOf = param;
        break;
    }
  }

  return schema;
}

function convertStringShape(shape: StringShape): JSONSchema {
  const schema: JSONSchema = { type: 'string' };

  for (const { type, param } of shape.operations) {
    switch (type) {
      case 'string.max':
        if (schema.maxLength === undefined || param < schema.maxLength) {
          schema.maxLength = param;
        }
        break;

      case 'string.min':
        if (schema.minLength === undefined || param > schema.minLength) {
          schema.minLength = param;
        }
        break;

      case 'string.regex':
        if (schema.pattern === undefined) {
          schema.pattern = param.toString();
        } else {
          (schema.allOf ||= []).push({ type: 'string', pattern: param });
        }
        break;
    }
  }

  return schema;
}

function convertRecordShape(
  shape: RecordShape<Shape<string, PropertyKey>, AnyShape>,
  converter: Converter
): JSONSchema {
  const schema: JSONSchema = { additionalProperties: converter.convert(shape.valuesShape) };

  if (shape.keysShape !== null) {
    schema.propertyNames = converter.convert(shape.keysShape);
  }
  return schema;
}

function getShapeTitle(shape: AnyShape): string | undefined {
  const { title } = shape.annotations;

  if (typeof title === 'string') {
    return title;
  }
}

function getShapeDescription(shape: AnyShape): string | undefined {
  const { description } = shape.annotations;

  if (typeof description === 'string') {
    return description;
  }
}
