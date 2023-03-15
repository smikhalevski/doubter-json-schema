# Doubter &times; JSON Schema&ensp;[![build](https://github.com/smikhalevski/doubter-json-schema/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/doubter-json-schema/actions/workflows/master.yml)

Converts [Doubter](https://github.com/smikhalevski/doubter) shapes from and to JSON schemas.

> **Warning**&ensp;This project is at the early development stage.

```shell
npm install --save-prod @doubter/json-schema
```

Define a shape:

```ts
import * as d from 'doubter';
import { toJSONSchema } from '@doubter/json-schema';

const shape = d.object({
  name: d.string(),
  age: d.number().gt(10).optional()
});
// ⮕ Shape<{ name: string, age?: number | undefined }>

const schema = toJSONSchema(shape);
```

The `schema` is a JSON schema object:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "age": {
      "type": "number",
      "exclusiveMinimum": 10
    }
  },
  "required": ["name"]
}
```
