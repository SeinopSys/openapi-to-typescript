import { Formatter } from '../formatter';
import { Operation } from '../operation';
import { OpenAPIObject } from '../typings/openapi';

const withoutIndentation = (s: string) => s.replace(/(\s*[\n]+)\s*/g, '\n').trim();
const withoutEmptyLines = (s: string) => s.replace(/\n+/g, '\n');

interface FetchClientFormatterOptions {
	serverUrl?: string;
}

export class FetchClientFormatter extends Formatter<Operation> {
	public url = 'https://example.com';

	constructor(apiSchema?: OpenAPIObject, { serverUrl }: FetchClientFormatterOptions = {}) {
		super();
		const useUrl = serverUrl || apiSchema?.servers?.[0]?.url;
		if (useUrl) {
			this.url = useUrl;
		}
	}

	public async renderToString(operations: Operation[]): Promise<string> {
		return `${this.renderBoilerplate()}\n${await super.renderToString(operations)}`;
	}

	public renderBoilerplate(): string {
		return withoutIndentation(`
      const fetch = require('node-fetch')
      const pick = (obj:any, keys:string[]) => keys.reduce((picked, key) => obj[key] !== undefined ? Object.assign(picked, {[key]: obj[key]}) : picked, {})
      const substitutePath = (pathName:string, body:any) => pathName.split('/').map(dir => dir.startsWith('{') ? body[dir.slice(1,-1)] : dir).join('/')
      const encodeQuery = (obj:any, keys:string[]) => require('querystring').encode(pick(obj, keys))
      const API_URL = ${JSON.stringify(this.url)}
    `);
	}

	public render(operation: Operation): Promise<string> {
		const { operationName, requestTypeName, responseTypeName } = this.names(operation);
		const typedef = `export type ${operationName} = (payload: ${requestTypeName}) => Promise<${responseTypeName}>;`;
		const fetchWrapper = withoutEmptyLines(`const ${operationName} =
      async (body:${requestTypeName}, options:any):Promise<${responseTypeName}> => {
        return fetch(${this.urlSnippet(operation)}, {
          ...options,
          method: ${JSON.stringify(operation.method)},
          ${operation.operationObject.requestBody ? 'body: JSON.stringify(body),' : ''}
        }).then((res:any) => res.json())
      }`);
		return Promise.resolve(`${typedef}\n${fetchWrapper}`);
	}

	public names(operation: Operation): { operationName: string; requestTypeName: string; responseTypeName: string } {
		const operationName = operation.name;
		const requestTypeName = operationName + 'Request';
		const responseTypeName = operationName + 'Result';
		return { operationName, requestTypeName, responseTypeName };
	}

	private urlSnippet(operation: Operation) {
		const queryParameterNames = operation.parameterNamesIn('query');
		const endpointURL = operation.hasAnyParametersIn('path') ?
			`API_URL + substitutePath(${JSON.stringify(operation.pathName)}, body)` :
			'API_URL';
		return queryParameterNames.length
			? `[${endpointURL}, encodeQuery(body, ${JSON.stringify(queryParameterNames)})].filter(x=>x).join('?')`
			: endpointURL;
	}
}
