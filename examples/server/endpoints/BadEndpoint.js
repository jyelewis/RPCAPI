const rpcapi = require('rpcapi');

class BadEndpoint extends rpcapi.APIEndpoint {
    $throwError() { //Use a promise to perform async tasks before responding to the request
        throw new Error('Aaaaa something went wrong');
    }
}

exports.BadEndpoint = BadEndpoint;
