const rpcapi = require('rpcapi');

//Endpoints
const CalculatorEndpoint = require('./endpoints/CalculatorEndpoint').CalculatorEndpoint;
const LoginEndpoint = require('./endpoints/LoginEndpoint').LoginEndpoint;
const PushToClientEndpoint = require('./endpoints/PushToClientEndpoint').PushToClientEndpoint;
const BadEndpoint = require('./endpoints/BadEndpoint').BadEndpoint;
const TypescriptCalculatorEndpoint = require('./endpoints/TypescriptCalculatorEndpoint').TypescriptCalculatorEndpoint;
const RestrictedEndpoint = require('./endpoints/RestrictedEndpoint').RestrictedEndpoint;

//Setup API
const api = new rpcapi.API();

//Register all endpoints
//These are the example endpoints, look inside for examples of how to write endpoints
api.registerEndpoint('calculator', CalculatorEndpoint); //Basic example, RPC actions
api.registerEndpoint('login', LoginEndpoint); //Async actions

api.registerEndpoint('pushToClient', PushToClientEndpoint); //Example of pushing data in the background to the client

api.registerEndpoint('bad', BadEndpoint); //Throws an error (endpoint: throwError)

api.registerEndpoint('typescriptCalculator', TypescriptCalculatorEndpoint); //Similar to the above calculator, using TS syntax

api.registerEndpoint('restricted', RestrictedEndpoint); //Uses accessKey to require authentication before returning private data

//Try accessing an endpoint via the webapi
// http://localhost:8081/api/calculator/add?a=1&b=2

api.listen(8081).then(() => {
    console.log('Example API Server listening on port 8081');
}).catch(console.error);
