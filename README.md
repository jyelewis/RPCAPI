[![Build status](https://travis-ci.org/jyelewis/RPCAPI.svg?branch=master)](https://travis-ci.org/jyelewis/RPCAPI) [![Coverage Status](https://coveralls.io/repos/github/jyelewis/RPCAPI/badge.svg?branch=master)](https://coveralls.io/github/jyelewis/RPCAPI?branch=master)

# RPC API
Provides a structure for hosting RPC style APIs, supports both http and websocket access out of the box.

RPCAPI is designed to be used within a node.js server,
generally alongside the client application (rpcapi-websocket-client) running in the web browser.

The server can then easily define 'endpoints' which are classes containing a collection of associated 'actions'
These actions are simple javascript functions, which take parameters and return a value.
Actions can then be called remotely, either using a websocket and the client SDK or via a web api. 

Designed to solve the problem of constantly building project structures around socket.io to manage many endpoints
as well as providing a much nicer way to communicate with the server (RPC instead of messaging).

## Contents
- [Benefits of RPC over socket messaging](#benefits-of-rpc-over-socket-messaging)
- [Getting started](#getting-started)
  - [Installation](#installation)
  - [Viewing the examples](#viewing-the-examples)
- [Server side](#server-side) 
  - [Starting a server](#starting-a-server)
  - [Defining endpoints](#defining-endpoints)
    - [Complete endpoint example](#complete-endpoint-example)
    - [Registering an endpoint](#registering-an-endpoint)
    - [Lifecycle hooks](#lifecycle-hooks)
    - [Defining an action](#defining-an-action)
    - [Action parameters](#action-parameters)
    - [Pushing to the client](#pushing-to-the-client)
- [Client side](#client-side)
  - [Accessing actions via the web api](#accessing-actions-via-the-web-api)
  - [Using the websocket client](#using-the-websocket-client)
- [Pushing to the client (implementation)](#pushing-to-the-client-implementation)
  - [Server code](#pushing-to-the-client---server-code)
  - [Client code](#pushing-to-the-client---client-code)
- [Authentication](#authentication)
  - [Checking access keys](#checking-access-keys)
  - [Providing an access key via webapi](#providing-an-access-key-via-webapi)
  - [Providing an access key via websocket client](#providing-an-access-key-via-websocket-client)
- [Advanced topics](#advanced-topics)
  - [Mocking](#mocking)
    - [Mocking APIClient example](#mocking-apiclient-example)
    - [Mocking APIEndpointClient example](#mocking-apiendpointclient-example)
  - [Creating custom access methods](#creating-custom-access-methods)
    

## Benefits of RPC over socket messaging
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
const isAuthenticated = await userService.callAction('authenticateUser', { email, password });

if (isAuthenticated) {
    console.log('Yay we are authenticated');
} else {
    console.log('Authentication failed :(');
}
```
Timeouts, invalid arguments and server errors are all automatically handled.

## Getting started

### Installation
This application is most useful with both RPCAPI on the server and RPCAPI-websocket-client on the client.
This allows a client application to easily call endpoint actions.

To install:
```bash
npm install --save rpcapi
```

or using yarn
```bash
yarn add rpcapi
```

### Viewing the examples
The best way to get started is to take a look at the examples directory, which includes a basic project with a few different endpoints
designed to show how to create and register endpoints and actions.

There is also a client example application which demonstrates how to use rpcapi-websocket-client. This client expects the server example to be running.

To start the server navigate to `examples/server` then run `npm start`
This will start a local server on port 8080

To view an example endpoint via the webapi navigate to `http://localhost:8081/api/calculator/add?a=1&b=2` in a web browser.

To start the client, open a new terminal window and navigate to `examples/websocketClient` and run npm start
The client will be served on port 8081 and can be viewed in a web browser.
 
 

## Server side

### Starting a server
The easiest way to start a server is to use the built in `api.listen()` method.
This will set up a web server and websocket server on the given port and respond to api requests.
```javascript
const rpcapi = require('rpcapi');

//Create our API instance
//This is what will be given to our access methods, we will register all our endpoints against this object
const api = new rpcapi.API();

//Register your endpoint classes here
//api.registerEndpoint('test', TestEndpoint);

//server listen
api.listen(8081).then(() => {
    console.log('Example API Server listening on port 8081');
});
```

If you want to manually manage your server, have a look at the advanced topic [Manage express and socketio manually](#manage-express-and-socketio-manually)

### Defining endpoints
Endpoints are defined as classes, extending rpcapi.APIEndpoint

Endpoints contain actions, which can be remotely called.
Actions can define, which are passed to them when they are called

#### Complete endpoint example
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

#### Registering an endpoint
Endpoint classes must be registered to the api.
You can register many endpoints, but they must all have different names
```javascript
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

See implementation details below at [Pushing to the client (implementation)](#pushing-to-the-client-implementation)

## Client side
### Accessing actions via the web api
By default the `WebAPIAccessMethod` binds to the path `/api`
This can be changed by passing in the `prefix` configuration parameter.

All actions must be called using the 'post' http method.
parameters can either be given as json or in a url encoded format

```javascript
const webApi = new rpcapi.WebAPIAccessMethod(api, { prefix: '/myApi' });
```

Once the server is running, you can access actions directly by requesting the url
```
/api/{endpoint name}/{action name}
param1={value1}&param2={value2}
```

For example, an authentication action
```
/api/login/authenticateUser
username=admin&password=Qwerty1
```

When using the web api, values are automatically converted to the correct type (as specified in `${action}Params`)
Types are checked and the endpoint will return an error if the parameters are not given correctly.

If an action requires an object or array for a parameter, you can use JSON to provide this value
For example
```
/api/calculator/sumAll
values=[1, 2, 3, 4]
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

## Pushing to the client (implementation)
One of the biggest advantages of sockets is the ability to push data from the server to the client without the client explicitly asking for data.
This is possible using the websocket client.

Pushing data to the client requires a websocket conenction, it will not work over a webapi connection.
To ensure the current connection method supports pushing/emitting, call `this.canEmit()`

### Pushing to the client - server code
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

### Pushing to the client - client code
```javascript
const pushToClientEndpoint = api.connectToEndpoint('pushToClient');

//Register code to run when the server sends us a 'time' event
pushToClientEndpoint.on('time', (currentTime) => {
    console.log('The server says the time is', currentTime);
});

//Call the startPushing action to request the server pushes the time to us every second
await pushToClientEndpoint.callAction('startPushing');
```

## Authentication
When connecting to an endpoint, you can optionally provide an accessKey, this is available to the endpoint class via `this.accessKey`

### Checking access keys
From the api endpoint on the class, throw AccessDeniedError to reject a request.
Generally this will be done after doing a lookup on the accessKey (`this.accessKey`) to determine whether the user has access to the requested resource.

AccessDeniedError can be thrown from connect() to prevent the connection being completed.
It can also be thrown from a specific action.

### Providing an access key via webapi
Access keys are simply passed as url parameters eg.
```
http://localhost:8081/api/calculator/add?accessKey=qwer2134&a=1&b=2
```

### Providing an access key via websocket client
When connecting to an endpoint, pass the access key as the second parameter to .connectToEndpoint()
```javascript
const ep = await apiClient.connectToEndpoint('test', 'myAccessKey');
```

It is also possible to set a default access key at a connection level.

This is useful when using access keys to identify a user, the default access key can be set after they login
and from then on all requests will be authenticated. (NOTE: Existing connections will remain unchanged)

```javascript
apiClient.accessKey = 'myAccessKey';
const ep = await apiClient.connectToEndpoint('test');
```


## Advanced topics

### Manage express and socketio manually
By default, RPCAPI will register its own express app and socket io server on the port given when you call `api.listen()`
However, sometimes control is required over these services.
For example when,
 - Creating a custom 404 page
 - Sharing a single port for both RPCAPI and another web service
 - Sending custom socket messages using a different namespace
 - Using RPCAPI in an application where express and socketio are already configured 

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

### Mocking
On the client it can be difficult to test modules that directly communicate with the server.

RPCAPI-websocket-client provides ready to go mocking classes for both
 - APIClient (the single connection object to the server)
 - APIEndpointClient (An endpoint, created by api.connectToEndpoint())
 
These classes do not establish any connection with the server, they simply simulate a predefined api structure for testing
 
#### Mocking APIClient example
 - Many endpoints and actions can be mocked (you could mock your entire backend if you wanted to)
 - There is fake delay of 10ms each call to simulate 'server lag'
   - This may be changed in a future version, while writing test cases it is not nice to be 'waiting' an arbitrary length of time before making more assertion

```javascript
const mockAPIClient = new MockAPIClient({
    endpoints: {
        testEndpoint: {
            actions: {
                testAction: () => {
                    return { someValue: 123 };
                }
            }
        }
    }
});

await mockAPIClient.connect();

const mockEP = await mockAPIClient.connectToEndpoint('testEndpoint');
const response = await mockEP.callAction('testAction');
console.log(response); // { someValue: 123 }
``` 

#### Mocking APIEndpointClient example
MockAPIEndpointClient is very similar to MockAPIClient, however it only mocks a single endpoint, and does not require 'connecting' (it simulates a single connected endpoint)
```javascript
    const mockAPIEndpointClient = new MockAPIEndpointClient({
        actions: {
            testAction: () => {
                return { a: 1 };
            },
            otherAction: () => {
                return { a: 2 };
            }
        }
    });
    
    const result1 = await mockAPIEndpointClient.callAction('testAction');
    console.log(result1); //{ a: 1 }
    
    const result2 = await mockAPIEndpointClient.callAction('otherAction');
    console.log(result2); //{ a: 2 }
```

### Creating custom access methods
Access methods are nothing special, they are just a module that takes in an API instance.
They can create new endpoint instances by calling api.getEndpoint(endpointName) to get an APIEndpoint instance

On this instance you can then call:
 - `actionExists(actionName)` - Boolean, if action exists
 - `actionParams(actionName)` - Object, keyed list of parameters and their types
 - `connect()` - Call this when the client is connected to this endpoint (generally immediately after creation). Only call this if the connection is long lived
 - `disconnect()` - Call when the client disconnects / the endpoint is not required anymore. Only call this if the connection is long lived
 - `registerEmitHandler(handlerFunc)` - Provide a function that will be called if the endpoint calls this.emit(), once you have provided a function this.canEmit() will return true
 - `callAction(actionName, args)` - Call an action by name