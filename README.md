![Build status](https://travis-ci.org/jyelewis/RPCAPI.svg?branch=master)

# RPC API
Provides a struture for hosting RPC style APIs, supports both http and websocket access out of the box

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


##Getting started

###Starting a server
