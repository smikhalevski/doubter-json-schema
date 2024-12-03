import * as d from 'doubter';
import { toJSONSchema } from '../main';

describe('toJSONSchema', () => {
  test('converts a shape', () => {
    const shape = d.object({
      aaa: d.string(),
    });

    expect(toJSONSchema(shape)).toEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        aaa: { type: 'string' },
      },
      required: ['aaa'],
    });
  });

  test('does not reference a shared schema', () => {
    const shape1 = d.object({
      ccc: d.string(),
    });

    const shape2 = d.object({
      aaa: shape1,
      bbb: shape1,
    });

    expect(toJSONSchema(shape2)).toEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        aaa: {
          type: 'object',
          properties: {
            ccc: { type: 'string' },
          },
          required: ['ccc'],
        },
        bbb: {
          type: 'object',
          properties: {
            ccc: { type: 'string' },
          },
          required: ['ccc'],
        },
      },
      required: ['aaa', 'bbb'],
    });
  });

  test('adds title and description', () => {
    const shape = d
      .object({
        aaa: d.string(),
      })
      .annotate({
        title: 'xxx',
        description: 'yyy',
      });

    expect(toJSONSchema(shape)).toEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        aaa: { type: 'string' },
      },
      required: ['aaa'],
      title: 'xxx',
      description: 'yyy',
    });
  });

  test('adds title and description via custom getters', () => {
    const shape = d
      .object({
        aaa: d.string(),
      })
      .annotate({
        xxx: 'ppp',
        yyy: 'qqq',
      });

    expect(
      toJSONSchema(shape, {
        getTitle: shape => shape.annotations.xxx,
        getDescription: shape => shape.annotations.yyy,
      })
    ).toEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        aaa: { type: 'string' },
      },
      required: ['aaa'],
      title: 'ppp',
      description: 'qqq',
    });
  });

  describe('cyclic dependencies', () => {
    test('converts a immediate cyclic schema', () => {
      const shape: any = d.lazy(() => shape);

      expect(toJSONSchema(shape)).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $ref: '#/definitions/shape1',
        definitions: {
          shape1: { $ref: '#/definitions/shape1' },
        },
      });
    });

    test('converts a cyclic schema with an intermediate shape', () => {
      const shape: any = d.object({
        aaa: d.lazy(() => shape),
      });

      expect(toJSONSchema(shape)).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $ref: '#/definitions/shape1',
        definitions: {
          shape1: {
            type: 'object',
            properties: {
              aaa: { $ref: '#/definitions/shape1' },
            },
            required: ['aaa'],
          },
        },
      });
    });

    test('multiple cyclic references', () => {
      const shape: any = d.object({
        aaa: d.lazy(() => shape),
        bbb: d.lazy(() => shape),
      });

      expect(toJSONSchema(shape)).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $ref: '#/definitions/shape1',
        definitions: {
          shape1: {
            type: 'object',
            properties: {
              aaa: { $ref: '#/definitions/shape1' },
              bbb: { $ref: '#/definitions/shape1' },
            },
            required: ['aaa', 'bbb'],
          },
        },
      });
    });

    test('deeply nested cyclic schema', () => {
      const shape1: any = d.object({
        bbb: d.object({
          ccc: d.lazy(() => shape1),
        }),
      });

      const shape2 = d.object({
        aaa: shape1,
      });

      expect(toJSONSchema(shape2)).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          aaa: { $ref: '#/definitions/shape1' },
        },
        required: ['aaa'],
        definitions: {
          shape1: {
            type: 'object',
            properties: {
              bbb: {
                type: 'object',
                properties: {
                  ccc: { $ref: '#/definitions/shape1' },
                },
                required: ['ccc'],
              },
            },
            required: ['bbb'],
          },
        },
      });
    });
  });

  describe('definitions', () => {
    test('converts definitions', () => {
      const shape1 = d.string();

      const shape2 = d.object({
        aaa: shape1,
      });

      expect(toJSONSchema(shape2, { definitions: { xxx: shape1 } })).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          aaa: { $ref: '#/definitions/xxx' },
        },
        required: ['aaa'],
        definitions: {
          xxx: { type: 'string' },
        },
      });
    });

    test('converts definitions with a cyclic schema', () => {
      const shape1: any = d.object({
        bbb: d.lazy(() => shape1),
      });

      const shape2 = d.object({
        aaa: shape1,
      });

      expect(toJSONSchema(shape2, { definitions: { xxx: shape1 } })).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          aaa: { $ref: '#/definitions/xxx' },
        },
        required: ['aaa'],
        definitions: {
          xxx: {
            type: 'object',
            properties: {
              bbb: { $ref: '#/definitions/xxx' },
            },
            required: ['bbb'],
          },
        },
      });
    });

    test('converts definitions with immediate cyclic schema', () => {
      const shape: any = d.lazy(() => shape);

      expect(toJSONSchema(shape, { definitions: { xxx: shape } })).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $ref: '#/definitions/xxx',
        definitions: {
          xxx: { $ref: '#/definitions/xxx' },
        },
      });
    });

    test('ignores unused definitions', () => {
      const shape1 = d.number();

      const shape2 = d.object({
        aaa: d.string(),
      });

      expect(toJSONSchema(shape2, { definitions: { xxx: shape1 } })).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          aaa: { type: 'string' },
        },
        required: ['aaa'],
      });
    });

    test('adds unused definitions', () => {
      const shape1 = d.number();

      const shape2 = d.object({
        aaa: d.string(),
      });

      expect(toJSONSchema(shape2, { definitions: { xxx: shape1 }, unusedDefinitions: true })).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          aaa: { type: 'string' },
        },
        required: ['aaa'],
        definitions: {
          xxx: { type: 'number' },
        },
      });
    });

    test('custom definitions key', () => {
      const shape1 = d.number();

      const shape2 = d.object({
        aaa: shape1,
      });

      expect(toJSONSchema(shape2, { definitions: { xxx: shape1 }, definitionsKey: 'zzz' })).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          aaa: { $ref: '#/zzz/xxx' },
        },
        required: ['aaa'],
        zzz: {
          xxx: { type: 'number' },
        },
      });
    });
  });

  describe('shape mapping', () => {
    test('converts a shape mapping', () => {
      const shape = d.string();

      expect(toJSONSchema({ xxx: shape })).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        definitions: {
          xxx: { type: 'string' },
        },
      });
    });

    test('converts a shape mapping with references', () => {
      const shape1 = d.string();

      const shape2 = d.object({
        aaa: shape1,
      });

      expect(toJSONSchema({ xxx: shape2, yyy: shape1 })).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        definitions: {
          xxx: {
            type: 'object',
            properties: {
              aaa: { $ref: '#/definitions/yyy' },
            },
            required: ['aaa'],
          },
          yyy: { type: 'string' },
        },
      });
    });

    test('converts a shape mapping with cross references', () => {
      const shape1: any = d.lazy(() => shape2);

      const shape2 = d.object({
        aaa: shape1,
      });

      expect(toJSONSchema({ xxx: shape2, yyy: shape1 })).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        definitions: {
          xxx: {
            type: 'object',
            properties: {
              aaa: { $ref: '#/definitions/yyy' },
            },
            required: ['aaa'],
          },
          yyy: { $ref: '#/definitions/xxx' },
        },
      });
    });
  });
});
