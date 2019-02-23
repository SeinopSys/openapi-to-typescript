import { GenerateTypes } from './index'

describe('openapi-typescript', () => {
  describe('GenerateTypes', () => {
    describe('given an empty openapi schema', () => {
      const schema = {
        components: {
          schemas: {}
        },
        paths: {}
      }
      it('should respond nothing', async () => {
        const typings = await GenerateTypes(schema)
        expect(typings).toMatch(/^\s*$/)
      })
    })

    describe('given the Petstore schema', () => {
      const schema = require('../fixtures/petstore.json')

      it('should output typesfor components.schemas ', async () => {
        const typings = await GenerateTypes(schema)
        expect(typings).toContain('export interface Pet')
        expect(typings).toContain('export type Pets = (Pet)[]')
      })
    })
  })
})