import * as d from 'doubter';
import { toJSONSchema } from '../main';

describe('README', () => {
  test('example', () => {
    const shape = d.object({
      name: d.string(),
      age: d.number().gt(10).optional(),
    });

    expect(toJSONSchema(shape)).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        age: {
          exclusiveMinimum: 10,
          type: 'number',
        },
      },
      required: ['name'],
    });
  });
});
