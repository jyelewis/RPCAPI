![Build status](https://travis-ci.org/jyelewis/RPCAPI.svg?branch=master)

# RPC API
Provides a structure for hosting RPC style APIs, supports both http and websocket access out of the box.

RPCAPI is designed to be used within a node.js server,
generally alongside the client application (rpcapi-websocket-client) running in the web browser.

The server can then easily define 'endpoints' which are classes containing a collection of associated 'actions'
These actions are simple javascript functions, which take parameters and return a value.
Actions can then be called remotely, either using a websocket and the client SDK or via a web api. 

Designed to solve the problem of constantly building project structures around socket.io to manage many endpoints
as well as providing a much nicer way to communicate with the server (RPC instead of messaging)

#### Benefits of RPC over socket messaging
Traditional socket.io code looks like this
```javascript
socket.emit('userService.authenticateUser', email, password);
socket.on('userService.authenticateUser', function(err, isAuthenticated) {
    if (err) { throw err; }

    if (isAuthenticated) {
        console.log('Yay we are authenticated');
    } else {
        console.log('Authentication failed :(');
    }
});
```

If we want to handle connection dropouts, timeouts, invalid arguments, unexpected internal server errors etc, this code gets much larger.

Out of the box, RPC API provides a much neater syntax
```javascript
const isAuthenticated = await userService.call('authenticateUser', email, password);

if (isAuthenticated) {
    console.log('Yay we are authenticated');
} else {
    console.log('Authentication failed :(');
}
```
Timeouts, invalid arguments and server errors are all automatically handled.


## Getting started
This application is most useful with both RPCAPI on the server and RPCAPI-websocket-client on the client.
This allows a client application to easily call endpoint actions.

To install:
```npm install rpcapi```
or using yarn
```yarn add rpcapi```

#### Viewing the examples
The best way to get started is to take a look at the examples directory, which includes a basic project with a few different endpoints
designed to show how to create and register endpoints and actions.

There is also a client example application which demonstrates how to use rpcapi-websocket-client. This client expects the server example to be running.

To start the server navigate to `examples/server` then run `npm start`
This will start a local server on port 8080

To view an example endpoint via the webapi navigate to `http://localhost:8081/api/calculator/add?a=1&b=2` in a web browser.

To start the client, open a new terminal window and navigate to `examples/websocketClient` and run npm start
The client will be served on port 8081 and can be viewed in a web browser.
 

### Starting a server
The webapi access method is designed to be run with an express webserver,
the websocket access method is designed to be run with a socket io instance.

These services need to be configured in order to provide access into your api endpoints.
```javascript
const rpcapi = require('rpcapi');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

//Setup express web server
const app = express();
const server = new http.Server(app);
const io = socketio(server);

//Create our API instance
//This is what will be given to our access methods, we will register all our endpoints against this object
const api = new rpcapi.API();

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
``` 

### Defining endpoints on the server
Endpoints are defined as classes, extending rpcapi.APIEndpoint

Endpoints contain actions, which can be remotely called.
Actions can define, which are passed to them when they are called

#### Complete example
```javascript
class ExampleEndpoint extends rpcapi.APIEndpoint {
    constructor() {
        super();
        
        $sayHelloParams = { name: 'string' };
    }
    
    connect() {
        //Runs when a client connects
    }
    
    disconnect() {
        //Runs when a client disconnects
    }
    
    $sayHello({ name }) {
        return {
            greeting: `Hello ${name}!`
        };
    }
}

api.registerEndpoint('example', ExampleEndpoint);
```

#### Lifecycle hooks
Lifecycle hooks fire when an endpoint is connected and disconnected.
These functions can be used to subscribe to events that the client might be interested in (for example a redis pub/sub service) or setting timers.
It is important to clean up and listeners and timers on disconnect to avoid wasting server time after a client has left.
An error will be thrown if .emit() is called after disconnect.

```javascript
class EmitterEndpoint extends rpcapi.APIEndpoint {
    connect() {
        //Runs when a client connects
        this.emitTimer = setInterval(() => {
            this.emit('randomNumber', Math.random());
        });
    }
    
    disconnect() {
        //Runs when a client disconnects
        clearTimeout(this.emitTimer);
    }
}
```

#### Defining an action
Actions are just functions on an endpoint class.

 - They must start with a '$' (this is not included as part of the action name)
 - They must return an object
 - They may return a promise that eventually resolves to an object (the request will wait for the action to resolve)
 - Any parameters must be explicitly defined (see below 'Action parameters')
 
```javascript
class ExampleEndpoint extends rpcapi.APIEndpoint {
    $sayHello() {
        return {
            greeting: 'Hi!'
        };
    }
}
```

#### Action parameters
 - All action parameters must be explicitly defined.
 - They are defined in an object on the endpoint, named ${actionName}Params
 - They must specify a variable type

Action parameter objects are written in the format
```javascript
$sayHelloParams = { name: 'string' }
```
When using javascript, these must be defined in the constructor of the class
```javascript
class ExampleEndpoint extends rpcapi.APIEndpoint {
    constructor() {
        super();
        
        $sayHelloParams = { name: 'string' };
    }
    
    $sayHello({ name }) {
        return {
            greeting: `Hello ${name}!`
        };
    }
}
```

If you are using typescript, these can be defined throughout the body of the class, which makes it easier to keep the params definition with the action function
```typescript
class ExampleEndpoint extends rpcapi.APIEndpoint {
    $sayHelloParams = { name: 'string' };
    $sayHello({ name }: { name: string }) {
        return {
            greeting: `Hello ${name}!`
        };
    }
}
```

#### Pushing to the client
See further down for more details.
There are 2 important functions to use when pushing data to the client

`this.canEmit()` - Boolean, returns true if the current connection method supports pushing, this.emit() will crash if called when this is false
`this.emit(eventName, arg1, arg2, etc...)` - Send an event to the client 

See implementation details below at [Pushing to the client (implementation)](#Pushing to the client implementation)


#### Registering an endpoint
Endpoint classes must be registered to the api.
You can register many endpoints, but they must all have different names
```javascript
api.registerEndpoint('example', ExampleEndpoint);
```

### Accessing actions via the web api
By default the `WebAPIAccessMethod` binds to the path `/api`
This can be changed by passing in the `prefix` configuration parameter.
```javascript
const webApi = new rpcapi.WebAPIAccessMethod(api, { prefix: '/myApi' });
```

Once the server is running, you can access actions directly by requesting the url
```
/api/{endpoint name}/{action name}?param1={value1}&param2={value2}
```

For example, an authentication action
```
/api/login/authenticateUser?username=admin&password=Qwerty1
```

When using the web api, values are automatically converted to the correct type (as specified in `${action}Params`)
Types are checked and the endpoint will return an error if the parameters are not given correctly.

If an action requires an object or array for a parameter, you can use JSON to provide this value
For example
```
/api/calculator/sumAll?values=[1, 2, 3, 4]
```

#### Web api limitations
Because the web api does not involve a persistent connection, endpoints behave slightly differently to using the websocket client
Anytime an action is called, a new instance of the appropriate action is created, and then destroyed when the request is complete.
This means that every api call is executed in its own instance of the endpoint.

Another limitation is pushing data to the client, because http is not bidirectional the server cannot push data to the client in the background.
It is possible to check if the current connection supports pushing to the client using `this.canEmit()` within the endpoint.
See the `PushToClientEndpoint.js` file in the examples for reference. 

### Using the websocket client
The websocket client is the easiest way to call actions on the server from a web browser.
There is an example of the websocket client in the examples directory, but the basic structure is straightforward.

```javascript
const rpcapiClient = require('rpcapi-websocket-client');

const api = new rpcapiClient.APIClient('http://localhost:8081/');

api.connect()
    .then(doMaths)
    .catch(console.error);

async function doMaths() {
    const calculatorEndpoint = await api.connectToEndpoint('calculator');
    
    //Call a remote method on the CalculatorEndpoint instance
    const addResult = await calculatorEndpoint.callAction('add', { a: 1, b: 2 });
    console.log('1 + 2 =', addResult.value);


    //Call another method on the same instance
    const multiplyResult = await calculatorEndpoint.callAction('multiply', { a: 5, b: 4 });
    console.log('5 * 4 =', multiplyResult.value);
    
    calculatorEndpoint.disconnect();
}
```

#### Long lived endpoints
It is important to note that when you call `api.connectToEndpoint('calculator')` you are creating a new instance of the CalculatorEndpoint on the server.
This is beneficial as this class instance can keep state across many action calls
For example
```javascript
const adderEndpoint = await api.connectToEndpoint('adder');

console.log(await adderEndpoint.callAction('getValue')); //0

adderEndpoint.callAction('add', { number: 1 });
console.log(await adderEndpoint.callAction('getValue')); //1

adderEndpoint.callAction('add', { number: 5 });
console.log(await adderEndpoint.callAction('getValue')); //6
 
``` 

These instances are individual to each client, you can even create many instances/connections from the same client.
For example
```javascript
//Create 2 adder connections
const adder1Endpoint = await api.connectToEndpoint('adder');
const adder2Endpoint = await api.connectToEndpoint('adder');

console.log(await adder1Endpoint.callAction('getValue')); //0
console.log(await adder2Endpoint.callAction('getValue')); //0

adder1Endpoint.callAction('add', { number: 14 });
adder2Endpoint.callAction('add', { number: 2 });

console.log(await adder1Endpoint.callAction('getValue')); //14
console.log(await adder2Endpoint.callAction('getValue')); //2
 
```

### Pushing to the client implementation
One of the biggest advantages of sockets is the ability to push data from the server to the client without the client explicitly asking for data.
This is possible using the websocket client.

Pushing data to the client requires a websocket conenction, it will not work over a webapi connection.
To ensure the current connection method supports pushing/emitting, call `this.canEmit()`

##### Server code
```javascript
class PushToClientEndpoint extends rpcapi.APIEndpoint {
    //Cleanup when the client disconnects
    disconnect() {
        clearTimeout(this.pushTimer);
    }

    $startPushing() {
        if (!this.canEmit()) {
            return { result: 'Cannot push, the connected method does not support pushing' };
        }

        clearTimeout(this.pushTimer);
        this.pushTimer = setInterval(() => {
            this.emit('time', Date.now()); //Will push to the client, the client can listen via apiEndpoint.on('time', cb);
        }, 1000);

        return { result: 'Pushing the current time every second (event: time)' };
    }
}
```

##### Client code
```javascript
const pushToClientEndpoint = api.connectToEndpoint('pushToClient');

//Register code to run when the server sends us a 'time' event
pushToClientEndpoint.on('time', (currentTime) => {
    console.log('The server says the time is', currentTime);
});

//Call the startPushing action to request the server pushes the time to us every second
await pushToClientEndpoint.callAction('startPushing');
```
