import { camelCase, upperFirst } from 'lodash';
import {
	OperationObject,
	ParameterLocation,
	ParameterObject,
	PathsObject,
	ReferenceObject,
} from './typings/openapi';

export class Operation {
	public readonly operationObject: OperationObject;
	public readonly name: string;
	public readonly method: string;
	public readonly pathName: string;

	constructor(operationObject: OperationObject, { pathName, method }: {
		pathName: string;
		method: string;
	}) {
		this.operationObject = operationObject;
		this.operationObject.parameters = operationObject.parameters || [];
		this.name = upperFirst(camelCase(operationObject.operationId || `${method} ${pathName}`));
		this.method = method;
		this.pathName = pathName;
	}

	public hasAnyParametersIn(parameterLocation: ParameterLocation): boolean {
		const parameters: OperationObject['parameters'] = this.operationObject.parameters || [];
		return parameters.some(param => this.isParameterInLocation(parameterLocation, param));
	}

	public parametersIn(parameterLocation: ParameterLocation): NonNullable<OperationObject['parameters']> {
		const parameters: OperationObject['parameters'] = this.operationObject.parameters || [];
		return parameters.filter(param => this.isParameterInLocation(parameterLocation, param));
	}

	public parameterNamesIn(parameterLocation: ParameterLocation): string[] {
		const paramObjects = this.parametersIn(parameterLocation).filter(param => 'name' in param) as ParameterObject[];
		return paramObjects.map(param => param.name);
	}

	private isParameterInLocation(parameterLocation: ParameterLocation, param: ParameterObject | ReferenceObject): boolean {
		return 'in' in param && param.in === parameterLocation;
	}
}

export const eachOperation = (paths: PathsObject): { [Symbol.iterator](): Generator<Operation, void> } => ({
	* [Symbol.iterator]() {
		for (const pathName of Object.keys(paths)) {
			for (const method of Object.keys(paths[pathName])) {
				yield new Operation(paths[pathName][method], { pathName, method });
			}
		}
	},
});

export const extractOperations = (paths: PathsObject): Operation[] => {
	const operations = [];
	for (const operation of eachOperation(paths)) operations.push(operation);
	return operations;
};
