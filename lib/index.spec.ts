import execa from 'execa';
import { FetchClientFormatter } from './formatters';
import { GenerateTypings, GenerateTypingsOptions } from './index';
import { OpenAPIObject } from './typings/openapi';

describe('GenerateTypings', () => {
	describe('given an empty openapi schema', () => {
		const schema: OpenAPIObject = {
			openapi: '3.0.0',
			info: {
				version: '1.0.0',
				title: 'Some API',
			},
			components: {
				schemas: {},
			},
			paths: {},
		};
		itShouldGenerateValidTypingsFromSchema(schema);
		it('should respond nothing', async () => {
			const generated = await GenerateTypings(schema);
			expect(generated).toMatch(/^\s*$/);
			expect(generated).toEqual('');
		});
	});

	describe('given the Petstore schema', () => {
		const schema = require('../fixtures/petstore.json');
		itShouldGenerateValidTypingsFromSchema(schema);
		it('should output types for components.schemas', async () => {
			const generated = await GenerateTypings(schema);
			expect(generated).toContain('export interface Pet');
			expect(generated).toContain('export type Pets = Pet[]');
		});
	});

	describe('given the Petstore Expanded schema', () => {
		const schema = require('../fixtures/petstoreExpanded.json');
		itShouldGenerateValidTypingsFromSchema(schema);
		it('should output types for components.schemas', async () => {
			const generated = await GenerateTypings(schema);
			expect(generated).toContain('export type Pet = NewPet & {');
			expect(generated).toContain('NewPet ');
		});
		it('should output types for paths', async () => {
			const generated = await GenerateTypings(schema);
			expect(generated).toContain('FindPetByIdRequest');
			expect(generated).toContain('FindPetByIdResult');
			expect(generated).toContain('export type FindPetByIdResult = Pet;\n');
			expect(generated).toContain('FindPetByIdFallback');
			expect(generated).toContain('export type FindPetByIdFallback = Error;\n');
		});

		describe('FetchClientFormatter', () => {
			const options = {
				operationFormatters: [new FetchClientFormatter(schema)],
			};
			itShouldGenerateValidTypingsFromSchema(schema, options);

			it('should generate client actions', async () => {
				const generated = await GenerateTypings(schema, options);
				expect(generated).toContain('method: "post"');
			});
		});
	});

	describe('given the OptionalProperties schema', () => {
		const schema = require('../fixtures/optionalProperties.json');
		itShouldGenerateValidTypingsFromSchema(schema);
		it('should output types with optional properties for request', async () => {
			const generated = await GenerateTypings(schema);
			expect(generated).toContain('size?: 100 | 200 | 300');
			expect(generated).toContain('token?: string');
		});
	});

	describe('given the Arrays schema', () => {
		const schema = require('../fixtures/arrays.json');
		itShouldGenerateValidTypingsFromSchema(schema);
		it('should output types with properly typed properties for request', async () => {
			const generated = await GenerateTypings(schema);
			expect(generated).toContain('types?: ("a" | "b" | "c" | "d")[]');
			expect(generated).toContain('aspectRatio: [(4 | 3 | 16 | 9), (4 | 3 | 16 | 9)]');
			expect(generated).toContain('widths?: [number] | [number, number] | [number, number, number]');
			expect(generated).toContain('heights?: [number, ...number[]]');
		});
	});

	describe('given the Nullables schema', () => {
		const schema = require('../fixtures/nullables.json');
		itShouldGenerateValidTypingsFromSchema(schema);
		it('should output types with properly typed properties for request', async () => {
			const generated = await GenerateTypings(schema);
			expect(generated).toContain('Example description for NullableNumberSchema');
			expect(generated).toContain('export type NullableNumberSchema = number | null');
			expect(generated).toContain('a: number');
			expect(generated).toContain('b?: boolean');
			expect(generated).toContain('c?: ("c1" | "c2") | null');
			expect(generated).toContain('d: string | null');
			expect(generated).toContain('e?: SomeOtherType | AndAnotherOne | null');
			expect(generated).toContain('f: (SomeOtherType & AndAnotherOne) | null');
			expect(generated).toContain('g?: AndAnotherOne | null');
			expect(generated).toContain('h?: SomeOtherType | null');
			expect(generated).toContain('Example description for MoreNullables.i');
			expect(generated).toContain('i?: SomeOtherType | AndAnotherOne | null');
			expect(generated).toContain('Example description for MoreNullables.j');
			expect(generated).toContain('j: (SomeOtherType & AndAnotherOne) | null');
			expect(generated).toContain('Example description for MoreNullables.k');
			expect(generated).toContain('k?: AndAnotherOne | null');
			expect(generated).toContain('Example description for MoreNullables.l');
			expect(generated).toContain('l?: SomeOtherType | null');
			expect(generated).toContain('Example description for EvenMoreNullables.m');
			expect(generated).toContain('m: SomeOtherType | AndAnotherOne | null;');
			expect(generated).toContain('Example description for EvenMoreNullables.n');
			expect(generated).toContain('n?: (SomeOtherType & AndAnotherOne) | null;');
			expect(generated).toContain('Example description for EvenMoreNullables.o');
			expect(generated).toContain('o: AndAnotherOne | null;');
			expect(generated).toContain('Example description for EvenMoreNullables.p');
			expect(generated).toContain('p?: SomeOtherType | null;');
		});
	});
});

function itShouldGenerateValidTypingsFromSchema(schema: any, options?: GenerateTypingsOptions) {
	it('should match generated snapshot', async () => {
		expect((await GenerateTypings(schema, options))).toMatchSnapshot();
	});

	it('does not contain assignment of undefined', async () => {
		expect(await GenerateTypings(schema, options)).not.toContain(' = undefined');
	});

	it('does not contain $magic$', async () => {
		expect(await GenerateTypings(schema, options)).not.toContain('$magic$');
	});

	it('should evaluate', async () => {
		const generated = await GenerateTypings(schema, options);
		if (/\S+/.test(generated)) await execa('ts-node', ['--eval', generated]);
	});
}
