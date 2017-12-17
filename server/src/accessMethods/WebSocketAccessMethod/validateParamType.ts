
import {paramType} from "../../APIEndpoint";
import {InvalidTypeError} from "./customErrors";

export function validateParamType(type: paramType, paramName: string, paramValue: any) {
    if (paramValue === undefined) {
        throw new InvalidTypeError(`Expected param '${paramName}' to be given, but it was not`);
    }

    if (type === paramType.string) {
        if (typeof paramValue !== 'string') {
            throw new InvalidTypeError(`Expected param '${paramName}' to be a string, but it was not`);
        }
    } else if(type === paramType.number) {
        if (typeof paramValue !== 'number') {
            throw new InvalidTypeError(`Expected param '${paramName}' to be a number, but it was not`);
        }
    } else if(type === paramType.boolean) {
        if (typeof paramValue !== 'boolean') {
            throw new InvalidTypeError(`Expected param '${paramName}' to be a boolean value, but it was not`);
        }
    } else if(type === paramType.object) {
        if (typeof paramValue !== 'object') {
            throw new InvalidTypeError(`Expected param '${paramName}' to be an object, but it was not`);
        }
    } else if(type === paramType.array) {
        if (!Array.isArray(paramValue)) {
            throw new InvalidTypeError(`Expected param '${paramName}' to be an array, but it was not`);
        }
    } else {
        throw new Error(`Type '${type}' for param ${paramName} is not a valid type`);
    }

    //TODO: Optional params?
}