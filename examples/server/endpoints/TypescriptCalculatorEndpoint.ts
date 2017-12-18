import {APIEndpoint} from "rpcapi";

export class TypescriptCalculatorEndpoint extends APIEndpoint {
    public $addParams = { a: 'number', b: 'number' };
    $add({a, b}: {a: number, b: number}) {
        return {
            value: a + b
        };
    }

    $specialAddParams = { a: 'number', b: 'number', addAsString: 'boolean' };
    $specialAdd({a, b, addAsString}: { a: number, b: number, addAsString: boolean }) {
        if (addAsString) {
            return {
                value: parseFloat(a.toString() + b.toString())
            };
        }
        return {
            value: a + b
        };
    }

    public $subtractParams = { a: 'number', b: 'number' };
    $subtract({a, b}: {a: number, b: number}) {
        return {
            value: a - b
        };
    }

    public $multiplyParams = { a: 'number', b: 'number' };
    $multiply({a, b}: {a: number, b: number}) {
        return {
            value: a * b
        };
    }

    public $slowAddParams = { a: 'number', b: 'number' };
    async $slowAdd({a, b}: {a: number, b: number}) {
        await delay(1000);
        return {
            value: a + b
        };
    }
}

function delay(timeout: number) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}
