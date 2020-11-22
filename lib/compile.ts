import { JSONSchema, ResolverOptions } from 'json-schema-ref-parser';
import { compile } from 'json-schema-to-typescript';
import { INTERNAL_SCHEME } from './refs';
import { OpenAPIObject, SchemaObject } from './typings/openapi';

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
            type = items.type;
          }
        }
        if (typeof schema.minItems === 'number' && typeof schema.maxItems === 'number' && schema.minItems <= schema.maxItems) {
          const defs = [];
          for (let i = schema.minItems; i <= schema.maxItems; i++) {
            defs.push(`[${new Array(schema.minItems + 1).map(() => type).join(', ')}]`);
          }
          return defs.join(' | ');
        }
        return type + '[]';
      }
      case 'number':
      case 'integer':
        return 'number';
      default:
        return typeof schema.type === 'string' ? schema.type : 'never';
    }
  }
};
