
import {paramType} from "../../APIEndpoint";
import {InvalidTypeError} from "./customErrors";

export function convertParamType(type: paramType, paramName: string, strValue: string) {
    let value: any = null;

    if (strValue === undefined) {
        throw new InvalidTypeError(`Expected param '${paramName}' to be given, but it was not`);
    }

    if (type === paramType.string) {
        value = strValue;
    } else if(type === paramType.number) {
        value = parseFloat(strValue);
        if (isNaN(value)) {
            throw new InvalidTypeError(`Expected param '${paramName}' to be a number, but it was not`);
        }
    } else if(type === paramType.boolean) {
        const boolVals: { [key: string]: boolean } = {
            'true': true,
            'false': false,
            '1': true,
            '0': false,
        };
        value = boolVals[strValue.toLowerCase()];
        if (value === undefined) {
            throw new InvalidTypeError(`Expected param '${paramName}' to be a boolean value, but it was not`);
        }
    } else if(type === paramType.object) {
        try {
            value = JSON.parse(strValue);
        } catch(e) {
            throw new InvalidTypeError(`Could not parse value of '${paramName}'`);
        }
    } else if(type === paramType.array) {
        try {
            value = JSON.parse(strValue);
        } catch(e) {
            throw new InvalidTypeError(`Could not parse value of '${paramName}'`);
        }

        if (!Array.isArray(value)) {
            throw new InvalidTypeError(`Expected param '${paramName}' to be an array, but it was not`);
        }
    }
    //TODO: Optional params?

    return value;
}