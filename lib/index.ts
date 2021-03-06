import 'source-map-support/register';
import { JSONSchema } from 'json-schema-to-typescript';

import { merge } from 'lodash';
import { Formatter } from './formatter';
import { RequestTypeFormatter, ResultTypeFormatter, SchemaFormatter } from './formatters';
import { extractOperations, Operation } from './operation';
import { InternalRefRewriter } from './refs';
import { OpenAPIObject } from './typings/openapi';

export interface GenerateTypingsOptions {
  operationFormatters?: Formatter<Operation>[];
}

export const GenerateTypings = async (
  apiSchema: OpenAPIObject,
  { operationFormatters = [] }: GenerateTypingsOptions = {},
): Promise<string> => {
  const schemas = merge({}, apiSchema?.components?.schemas);
  const paths = merge({}, apiSchema.paths);
  const codeChunks: string[] = [];

  new InternalRefRewriter().rewrite(schemas);
  new InternalRefRewriter().rewrite(paths);

  for (const schemaName of Object.keys(schemas)) {
    codeChunks.push(await new SchemaFormatter(schemaName).render(schemas[schemaName] as JSONSchema));
  }

  const formatters: Formatter<Operation>[] = [
    new RequestTypeFormatter(),
    new ResultTypeFormatter(),
    ...operationFormatters,
  ];

  const operations = extractOperations(paths);
  for (const formatter of formatters) {
    const renderedString = await formatter.renderToString(operations);
    if (renderedString) codeChunks.push(renderedString);
  }

  return codeChunks.join('\n');
};
