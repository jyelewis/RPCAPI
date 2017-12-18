const rpcapi = require('rpcapi');

class PushToClientEndpoint extends rpcapi.APIEndpoint {
    constructor() {
        super();

        this.pushTimer = null;

        //You do not have to specify params if there are none
    }

    //Cleanup when the client disconnects
    disconnect() {
        clearTimeout(this.pushTimer);
    }

    $startPushing() {
        if (!this.canEmit()) {
            return { result: 'Cannot push, the connected method does not support pushing' };
        }

        if (this.pushTimer) {
            return { result: 'Already pushing' };
        }

        this.pushTimer = setInterval(() => {
            this.emit('time', Date.time()); //Will push to the client, the client can listen via apiEndpoint.on('time', cb);
        }, 1000);

        return { result: 'Pushing the current time every second (event: time)' };
    }

    $stopPushing() {
        if (!this.pushTimer) {
            return { result: 'Was not pushing' };
        }

        clearTimeout(this.pushTimer);

        return { result: 'Pushing stopped' };
    }
}

exports.PushToClientEndpoint = PushToClientEndpoint;
