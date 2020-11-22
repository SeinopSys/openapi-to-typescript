# @seinopsys-forks/openapi-to-typescript

[![NPM version](https://img.shields.io/npm/v/seinopsys-forks/openapi-to-typescript.svg)](https://www.npmjs.com/package/@seinopsys-forks/openapi-to-typescript)
[![Build Status](https://travis-ci.com/SeinopSys/openapi-to-typescript.svg?branch=main)](https://travis-ci.com/github/SeinopSys/openapi-to-typescript)

Generate TypeScript typings based on an OpenAPI 3 schema definition.

# Install

Run `npm install @seinopsys-forks/openapi-to-typescript` or `yarn add @seinopsys-forks/openapi-to-typescript`

# Usage in javascript

```javascript
const { GenerateTypings } = require('@seinopsys-forks/openapi-to-typescript')

const generatedTypescriptCode = await GenerateTypings(openapiSchema)
fs.writeFileSync('out.ts', generatedTypescriptCode)
```

# CLI Usage

`yarn cli --help`

### For development

```javascript
const { GenerateTypings } = require('./dist/index')

GenerateTypings(require('./fixtures/petstore.json')).then((generatedTypescriptCode: string) => {
  fs.writeFileSync('out.ts', generatedTypescriptCode)
})
```
