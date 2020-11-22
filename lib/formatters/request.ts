import { get } from 'lodash';

import { JSONSchema } from 'json-schema-ref-parser';
import { getSchemaName, getSchemaNameByRef } from '../compile';
import { Formatter } from '../formatter';
import { Operation } from '../operation';
import { ParameterObject } from '../typings/openapi';

export class RequestTypeFormatter extends Formatter<Operation> {
  public render(operation: Operation): Promise<string> {
    const typeName = `${operation.name}Request`;
    const parameters = operation.operationObject.parameters || [];
    return Promise.resolve(this.toTypescriptInterface(operation, typeName, parameters as ParameterObject[]));
  }

  public toTypescriptInterface(operation: Operation, typeName: string, parameters: ParameterObject[]): string {
    const requestSchema = get(operation.operationObject, 'requestBody.content["application/json"].schema') as JSONSchema | undefined;
    const aliasedType = requestSchema && requestSchema.$ref && getSchemaNameByRef(requestSchema.$ref);

    if (parameters.length === 0 && aliasedType) return `export type ${typeName} = ${aliasedType}`;

    const startLine = aliasedType
      ? `export type ${typeName} = ${aliasedType} & {`
      : `export interface ${typeName} {`;
    return [
      startLine,
        ...parameters.map((param) => {
          const schema = param.schema as JSONSchema;
          const paramName = schema.type === 'array' && param.name.endsWith('[]')
            ? param.name.replace(/\[]$/, '')
            : param.name;
          const optional = param.required !== true && param.in !== 'path' ? '?' : '';
          const nullable = param.nullable === true ? ' | null' : '';
          return `  ${paramName}${optional}: ${getSchemaName(schema, param.name) + nullable}`;
        }),
      '}',
    ].join('\n');
  }
}
