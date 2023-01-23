import * as d from 'doubter';
import { toJSONSchema } from '../main';

describe('toJSONSchema', () => {
  test('resolves refs', () => {
    const shape = d.object({
      foo: d.string(),
    });

    expect(toJSONSchema(shape, { definitions: { foo: shape } })).toEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $ref: '#/definitions/foo',
      definitions: {
        foo: {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
          required: ['foo'],
        },
      },
    });
  });

  test('converts object shape to schema', () => {
    const shape = d.object({
      foo: d.string().optional(),
      bar: d.number().gt(10),
    });

    expect(toJSONSchema(shape)).toEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        foo: {
          oneOf: [{ type: 'null' }, { type: 'string' }],
        },
        bar: {
          type: 'number',
          exclusiveMinimum: 10,
        },
      },
      required: ['bar'],
    });
  });

  test('converts named shapes object to schema', () => {
    const shape1 = d.object({
      foo: d.string(),
      qux: d.lazy(() => shape2),
    });

    const shape2 = d.object({
      bar: d.number(),
    });

    expect(toJSONSchema({ shape1, shape2 })).toEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      definitions: {
        shape1: {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            qux: {
              properties: {
                bar: { type: 'number' },
              },
              required: ['bar'],
              type: 'object',
            },
          },
          required: ['foo', 'qux'],
        },
        shape2: {
          type: 'object',
          properties: {
            bar: { type: 'number' },
          },
          required: ['bar'],
        },
      },
    });
  });
});
