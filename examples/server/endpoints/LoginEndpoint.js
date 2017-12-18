const rpcapi = require('rpcapi');

class LoginEndpoint extends rpcapi.APIEndpoint {
    constructor() {
        super();

        //Define the datatypes of each parameter
        this.$authenticateUserParams = { username: 'string', password: 'string' };
    }

    $authenticateUser({ username, password }) { //Use a promise to perform async tasks before responding to the request
        return checkLogin(username, password).then(isValidUser => {
            if (isValidUser) {
                return { success: true };
            }

            return { success: false, error: 'Incorrect username or password (try admin/Password1)' };
        });
    }
}

function checkLogin(username, password) {
    return new Promise(resolve => {
        setTimeout(function () {
            resolve(username === 'admin' && password === 'Password1');
        }, 1000);
    });
}

exports.LoginEndpoint = LoginEndpoint;
