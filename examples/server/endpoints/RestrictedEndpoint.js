const rpcapi = require('rpcapi');

class RestrictedEndpoint extends rpcapi.APIEndpoint {
    constructor() {
        super();
    }

    $getSecretData() {
        if (!isValidAccessKey(this.accessKey)) {
            throw new rpcapi.AccessDeniedError('Invalid access key (try asdfqwer1234)');
        }

        return { secrets: 'hi there' };
    }
}

function isValidAccessKey(accessKey) {
    return accessKey === 'asdfqwer1234';
}

exports.RestrictedEndpoint = RestrictedEndpoint;
