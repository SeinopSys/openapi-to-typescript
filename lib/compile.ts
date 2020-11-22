import { JSONSchema, ResolverOptions } from 'json-schema-ref-parser';
import { compile } from 'json-schema-to-typescript';
import { INTERNAL_SCHEME } from './refs';

export const compileSchema = async (schema: JSONSchema, schemaName: string): Promise<string> =>
	compile(schema as any, schemaName, {
		bannerComment: '',
		$refOptions: {
			resolve: {
				magic: {
					order: -100,
					canRead: new RegExp(`^${INTERNAL_SCHEME}://`),
					read: magicReader,
				},
			},
		},
	}).then(removeMagic);

const magicReader: ResolverOptions['read'] = def => {
	const interfaceName = getSchemaNameByRef(def.url);
	return `{ type: 'string', enum: ['$magic$${interfaceName}'] }`;
};

export const getSchemaNameByRef = (url: string): string =>
	url.split('/').pop() as string;

const removeMagic = (line: string): string =>
	line.replace(/"\$magic\$[^"]+"/g, (found) => found.substr(8, found.length - 9));

export const getSchemaName = (schema: JSONSchema, schemaName: string): string => {
	if (schema.$ref) {
		return getSchemaNameByRef(schema.$ref);
	} else {
		switch (schema.type) {
			case 'object':
				// function compileSchemaAndReturnName(schema: JSONSchema, schemaName: string) {}
				return schemaName;
			case 'array': {
				const items = schema.items;
				let type = 'any';
				if (typeof items === 'object' && !Array.isArray(items)) {
					if (items.$ref) {
						type = getSchemaNameByRef(items.$ref);
					} else if (typeof items.type === 'string') {
						type = getSchemaName(items, type);
						if (/[\s\][().'"|]/.test(type)) {
							type = `(${type})`;
						}
					}
				}
				if (typeof schema.minItems === 'number' && typeof schema.maxItems === 'number') {
					if (schema.minItems <= schema.maxItems) {
						const simpleFixedSizeArray =  schema.maxItems - schema.minItems < 5;
						if (simpleFixedSizeArray) {
							const defs = [];
							for (let i = schema.minItems; i <= schema.maxItems; i++) {
								defs.push(`[${new Array(i).fill(type).join(', ')}]`);
							}
							return defs.join(' | ');
						} else if (schema.minItems >= 1) {
							const defs = new Array(schema.minItems).fill(type).join(', ');
							return `[${defs}, ...${type}[]]`;
						}
					}
				}
				return type + '[]';
			}
			case 'string':
				if (schema.enum) {
					return schema.enum.map(el => JSON.stringify(el)).join(' | ');
				}
				return 'string';
			case 'number':
			case 'integer':
				if (schema.enum) {
					return schema.enum.join(' | ');
				}
				return 'number';
			default:
				return typeof schema.type === 'string' ? schema.type : 'never';
		}
	}
};
