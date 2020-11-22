// Suport for Specification Extensions
// as described in
// https://github.com/OAI/OpenAPI-Specification/blob/3.0.0-rc0/versions/3.0.md#specificationExtensions

//  Specification Extensions
//   ^x-
export interface ISpecificationExtension<T = any> {
    // Cannot constraint to "^x-" but can filter them later to access to them
    [extensionName: string]: T;
}

export class SpecificationExtension<T = any> {
    // Cannot constraint to "^x-" but can filter them later to access to them
    protected extensions: Record<string, T> = {};

    public static isValidExtension(extensionName: string): boolean {
        return /^x-/.test(extensionName);
    }

    public getExtension(extensionName: string): T | null {
        if (!SpecificationExtension.isValidExtension(extensionName)) {
            throw new Error("Invalid specification extension: '" +
                        extensionName + "'. Extensions must start with prefix 'x-");
        }
        if (this.extensions[extensionName]) {
            return this.extensions[extensionName];
        }
        return null;
    }

    public addExtension(extensionName: string, payload: T): void {
        if (!SpecificationExtension.isValidExtension(extensionName)) {
            throw new Error("Invalid specification extension: '" +
                        extensionName + "'. Extensions must start with prefix 'x-");
        }
        this.extensions[extensionName] = payload;

        Object.defineProperty(this, extensionName, {
            writable: false,
            configurable: false,
            value: payload
        });
    }
    public listExtensions(): string[] {
        const res: string[] = [];
        for (const propName in this.extensions) {
            if (this.extensions.hasOwnProperty(propName)) {
                if (SpecificationExtension.isValidExtension(propName)) {
                    res.push(propName);
                }
            }
        }
        return res;
    }
}
