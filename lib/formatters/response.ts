import { JSONSchema } from 'json-schema-ref-parser';
import { camelCase, upperFirst } from 'lodash';

import { compileSchema } from '../compile';
import { Formatter } from '../formatter';
import { Operation } from '../operation';

export class ResultTypeFormatter extends Formatter<Operation> {
	public readonly contentType: string = 'application/json';

	public async render(operation: Operation): Promise<string> {
		const definitions = this.getResponseSchemaDefinitions(operation);
		const compilations = await Promise.all(
			definitions.map(({ schema, typeName }) =>
				this.compileDefinition(schema, typeName)),
		);
		return compilations.join('\n');
	}

	private async compileDefinition(schema: JSONSchema, typeName: string) {
		return schema ?
			compileSchema(schema, typeName) :
			`export type ${typeName} = any`;
	}

	private getResponseSchemaDefinitions(operation: Operation): ResponseSchemaDefinition[] {
		const responsesByStatusCode = operation.operationObject?.responses || {};
		const statusCodes = this.getStatusCodes(responsesByStatusCode);
		return statusCodes.map(((statusCode, index): ResponseSchemaDefinition => {
			const typeName = this.typeNameFor(operation, index === 0 ? 'Result' : statusCode);
			const response = responsesByStatusCode[statusCode];
			if ('$ref' in response) {
				throw new Error('Unhandled response.$ref in getResponseSchemaDefinitions');
			}
			const schema = response?.content?.[this.contentType]?.schema as JSONSchema;
			return { schema, statusCode, typeName };
		}));
	}

	private getStatusCodes(responsesByStatusCode: any) {
		const whitelist: (number | string)[] = ['default'];
		return Object.keys(responsesByStatusCode)
			.map((n) => whitelist.includes(n) ? n : parseInt(n, 10))
			.filter((n) => whitelist.includes(n) || n >= 200 && n < 400)
			.sort();
	}

	private typeNameFor(operation: Operation, suffix: number | string) {
		return upperFirst(camelCase(`
      ${operation.name}
      ${suffix === 'default' ? 'fallback' : suffix.toString()}
    `));
	}
}

interface ResponseSchemaDefinition {
	schema: JSONSchema;
	typeName: string;
	statusCode: number | string | 'default';
}
