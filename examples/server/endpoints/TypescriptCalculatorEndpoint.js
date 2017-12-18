"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rpcapi_1 = require("rpcapi");
class TypescriptCalculatorEndpoint extends rpcapi_1.APIEndpoint {
    constructor() {
        super(...arguments);
        this.$addParams = { a: 'number', b: 'number' };
        this.$specialAddParams = { a: 'number', b: 'number', addAsString: 'boolean' };
        this.$subtractParams = { a: 'number', b: 'number' };
        this.$multiplyParams = { a: 'number', b: 'number' };
        this.$slowAddParams = { a: 'number', b: 'number' };
    }
    $add({ a, b }) {
        return {
            value: a + b
        };
    }
    $specialAdd({ a, b, addAsString }) {
        if (addAsString) {
            return {
                value: parseFloat(a.toString() + b.toString())
            };
        }
        return {
            value: a + b
        };
    }
    $subtract({ a, b }) {
        return {
            value: a - b
        };
    }
    $multiply({ a, b }) {
        return {
            value: a * b
        };
    }
    $slowAdd({ a, b }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield delay(1000);
            return {
                value: a + b
            };
        });
    }
}
exports.TypescriptCalculatorEndpoint = TypescriptCalculatorEndpoint;
function delay(timeout) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}
//# sourceMappingURL=TypescriptCalculatorEndpoint.js.map