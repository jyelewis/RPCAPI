const rpcapi = require('rpcapi');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

//Endpoints
const CalculatorEndpoint = require('./endpoints/CalculatorEndpoint').CalculatorEndpoint;
const LoginEndpoint = require('./endpoints/LoginEndpoint').LoginEndpoint;
const PushToClientEndpoint = require('./endpoints/PushToClientEndpoint').PushToClientEndpoint;
const BadEndpoint = require('./endpoints/BadEndpoint').BadEndpoint;
const TypescriptCalculatorEndpoint = require('./endpoints/TypescriptCalculatorEndpoint').TypescriptCalculatorEndpoint;

//Setup express web server
const app = express();
const server = new http.Server(app);

//Setup socket io
const io = socketio(server);

//Setup API
const api = new rpcapi.API();

//Register all endpoints
//These are the example endpoints, look inside for examples of how to write endpoints
api.registerEndpoint('calculator', CalculatorEndpoint); //Basic example, RPC actions
api.registerEndpoint('login', LoginEndpoint); //Async actions

api.registerEndpoint('pushToClient', PushToClientEndpoint); //Example of pushing data in the background to the client

api.registerEndpoint('bad', BadEndpoint); //Throws an error (endpoint: throwError)

api.registerEndpoint('typescriptCalculator', TypescriptCalculatorEndpoint); //Similar to the above calculator, using TS syntax

//Try accessing an endpoint via the webapi
// http://localhost:8081/api/calculator/add?a=1&b=2

//Setup access methods, you do not need both, you can choose one
//These access methods define how an api can be accessed
//if you want to use the websocket client, then the websocket access method must be enabled

//Setup websocket access method
const socketApi = new rpcapi.WebSocketAccessMethod(api);
socketApi.bind(io); //Bind socket access method to socket.io instance

//Setup webapi access method
const webApi = new rpcapi.WebAPIAccessMethod(api);
webApi.bind(app); //Bind webapi access method to express web server


//server listen
server.listen(8081, () => {
    console.log('Example API Server listening on port 8081');
});
