const rpcapi = require('rpcapi');

class CalculatorEndpoint extends rpcapi.APIEndpoint {
    constructor() {
        super();

        //Define the datatypes of each parameter
        this.$addParams = { a: 'number', b: 'number' };
        this.$subtractParams = { a: 'number', b: 'number' };
        this.$multiplyParams = { a: 'number', b: 'number' };
    }

    $add({a, b}) { //Each endpoint must start with a '$' (this is not included in the endpoint name)
        return { //Endpoints must return an object
            value: a + b
        };
    }

    $subtract({a, b}) {
        return {
            value: a - b
        };
    }

    $multiply({a, b}) {
        return {
            value: a * b
        };
    }
}

exports.CalculatorEndpoint = CalculatorEndpoint;
