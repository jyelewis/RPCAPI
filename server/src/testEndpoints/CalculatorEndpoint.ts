
import {APIEndpoint} from "../APIEndpoint";

export class CalculatorEndpoint extends APIEndpoint {
    private sendAdds: boolean = false;

    public $watchAdds() {
        if (!this.canEmit()) {
            throw new Error('Cannot watch adds from and endpoint that cannot receive events');
        }
        this.sendAdds = true;

        return { done: true };
    }

    public $addParams = { a: 'number', b: 'number' };
    $add({a, b}: {a: number, b: number}) {
        const value = a + b;
        if (this.sendAdds) {
            this.emit('addCalculationPerformed', value);
        }

        return { value };
    }

    $specialAddParams = { a: 'number', b: 'number', strAdd: 'boolean' };
    $specialAdd({a, b, strAdd}: { a: number, b: number, strAdd: boolean }) {
        if (strAdd) {
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

    $throws() {
        throw new Error('Something broke (this error is intentional, for testing)');
    }
}


function delay(timeout: number) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}
