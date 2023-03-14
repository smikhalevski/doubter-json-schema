import * as d from 'doubter';
import { toJSONSchema2 } from '../main/toJSONSchema2';

describe('toJSONSchema2', () => {
  test('1', () => {
    const shape = d.object({
      aaa: d.string(),
    });

    expect(toJSONSchema2(shape)).toEqual({
      type: 'object',
      properties: {
        aaa: { type: 'string' },
      },
      required: ['aaa'],
    });
  });

  test('2', () => {
    const shape: any = d.lazy(() => shape);

    expect(toJSONSchema2(shape)).toEqual({
      $ref: 0,
      definitions: {
        '0': { $ref: 0 },
      },
    });
  });

  test('3', () => {
    const shape: any = d.object({
      aaa: d.lazy(() => shape),
    });

    expect(toJSONSchema2(shape)).toEqual({
      $ref: 0,
      definitions: {
        '0': {
          type: 'object',
          properties: {
            aaa: { $ref: 0 },
          },
          required: ['aaa'],
        },
      },
    });
  });

  test('4', () => {
    const shape: any = d.object({
      aaa: d.lazy(() => shape),
      bbb: d.lazy(() => shape),
    });

    expect(toJSONSchema2(shape)).toEqual({
      $ref: 0,
      definitions: {
        '0': {
          type: 'object',
          properties: {
            aaa: { $ref: 0 },
            bbb: { $ref: 0 },
          },
          required: ['aaa', 'bbb'],
        },
      },
    });
  });

  test('5', () => {
    const shape1 = d.object({
      ccc: d.string(),
    });

    const shape2 = d.object({
      aaa: shape1,
      bbb: shape1,
    });

    expect(toJSONSchema2(shape2)).toEqual({
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

  test('6', () => {
    const shape1: any = d.object({
      bbb: d.object({
        ccc: d.lazy(() => shape1),
      }),
    });

    const shape2 = d.object({
      aaa: shape1,
    });

    expect(toJSONSchema2(shape2)).toEqual({
      type: 'object',
      properties: {
        aaa: { $ref: 0 },
      },
      required: ['aaa'],
      definitions: {
        '0': {
          type: 'object',
          properties: {
            bbb: {
              type: 'object',
              properties: {
                ccc: { $ref: 0 },
              },
              required: ['ccc'],
            },
          },
          required: ['bbb'],
        },
      },
    });
  });

  describe('definitions', () => {
    test('1', () => {
      const shape1 = d.string();

      const shape2 = d.object({
        aaa: shape1,
      });

      expect(toJSONSchema2(shape2, { definitions: { xxx: shape1 } })).toEqual({
        type: 'object',
        properties: {
          aaa: { $ref: 'xxx' },
        },
        required: ['aaa'],
        definitions: {
          xxx: { type: 'string' },
        },
      });
    });

    test('2', () => {
      const shape1: any = d.object({
        bbb: d.lazy(() => shape1),
      });

      const shape2 = d.object({
        aaa: shape1,
      });

      expect(toJSONSchema2(shape2, { definitions: { xxx: shape1 } })).toEqual({
        type: 'object',
        properties: {
          aaa: { $ref: 'xxx' },
        },
        required: ['aaa'],
        definitions: {
          xxx: {
            type: 'object',
            properties: {
              bbb: { $ref: 'xxx' },
            },
            required: ['bbb'],
          },
        },
      });
    });

    test('3', () => {
      const shape: any = d.lazy(() => shape);

      expect(toJSONSchema2(shape, { definitions: { xxx: shape } })).toEqual({
        $ref: 'xxx',
        definitions: {
          xxx: { $ref: 'xxx' },
        },
      });
    });

    test('ignores unused dependencies', () => {
      const shape1 = d.number();

      const shape2 = d.object({
        aaa: d.string(),
      });

      expect(toJSONSchema2(shape2, { definitions: { xxx: shape1 } })).toEqual({
        properties: {
          aaa: { type: 'string' },
        },
        required: ['aaa'],
        type: 'object',
      });
    });

    test('adds unused dependencies', () => {
      const shape1 = d.number();

      const shape2 = d.object({
        aaa: d.string(),
      });

      expect(toJSONSchema2(shape2, { definitions: { xxx: shape1 }, unusedDependencies: true })).toEqual({
        definitions: {
          xxx: { type: 'number' },
        },
        properties: {
          aaa: { type: 'string' },
        },
        required: ['aaa'],
        type: 'object',
      });
    });
  });
});
