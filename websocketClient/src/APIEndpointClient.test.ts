import test from 'ava'
import {EventEmitter} from "./util/EventEmitter";
import { APIEndpointClient } from "./APIEndpointClient";

test('Emits event on socket when call()\'ed', async t => {
    const mockSocket = new EventEmitter();

    mockSocket.on('callEndpointFunction', (endpointConnectionId: string, actionName: string, args: any, cb: (errorMessage: string, res: any) => void) => {
        t.is(endpointConnectionId, 'ep1');
        t.is(actionName, 'testAction');
        t.deepEqual(args, {});

        cb(null, { val: 'Hello world!' });
    });

    const apiEndpointClient = new APIEndpointClient(mockSocket, 'ep1');
    const response = await apiEndpointClient.callAction('testAction', {});
    t.deepEqual(response, { val: 'Hello world!' });
});

test('Throws if socket response contains an error', async t => {
    const mockSocket = new EventEmitter();

    mockSocket.on('callEndpointFunction', (endpointConnectionId: string, actionName: string, args: any, cb: (errorMessage: string, res: any) => void) => {
        cb('test error', null);
    });

    const apiEndpointClient = new APIEndpointClient(mockSocket, 'ep1');
    try {
        await apiEndpointClient.callAction('testAction', {});
        t.fail('Did not throw');
    } catch(e) {
        t.is(e.message, 'test error');
        t.pass();
    }
});

test('Passes params to server', async t => {
    const mockSocket = new EventEmitter();

    mockSocket.on('callEndpointFunction', (endpointConnectionId: string, actionName: string, args: any, cb: (errorMessage: string, res: any) => void) => {
        t.deepEqual(args, { a: 123, b: 'hello!' });

        cb(null, { val: 'Hello world!' });
    });

    const apiEndpointClient = new APIEndpointClient(mockSocket, 'ep1');
    const response = await apiEndpointClient.callAction('testAction', { a: 123, b: 'hello!' });
    t.deepEqual(response, { val: 'Hello world!' });
});

test('Registers emitEvent listener', async t => {
    const mockEE = new EventEmitter();

    t.is(mockEE.numListeners('emitEvent.epid'), 0);

    new APIEndpointClient(mockEE, 'epid');

    t.is(mockEE.numListeners('emitEvent.epid'), 1);
});

test('Unregisters emitEvent listener on disconnect', async t => {
    const mockEE = new EventEmitter();

    const apiEndpoint = new APIEndpointClient(mockEE, 'epid');
    t.is(mockEE.numListeners('emitEvent.epid'), 1);

    apiEndpoint.disconnect();
    t.is(mockEE.numListeners('emitEvent.epid'), 0);
});

test('Handles server sent events', t => {
    return new Promise(resolve => {
        const mockSocket = new EventEmitter();

        const apiEndpointClient = new APIEndpointClient(mockSocket, 'ep1');

        apiEndpointClient.on('testEvent', () => {
            t.pass();
            resolve();
        });

        mockSocket.emit('emitEvent.ep1', 'testEvent', []);
    });
});

test('Handles args from server sent events', t => {
    return new Promise(resolve => {
        const mockSocket = new EventEmitter();

        const apiEndpointClient = new APIEndpointClient(mockSocket, 'ep1');

        apiEndpointClient.on('testEvent', (a: string, b: number) => {
            t.is(a, 'hello');
            t.is(b, 123);
            t.pass();

            resolve();
        });

        mockSocket.emit('emitEvent.ep1', 'testEvent', ['hello', 123]);
    });
});

test('Stops listening to server send events after off()', t => {
    return new Promise(resolve => {
        t.plan(0);

        const mockSocket = new EventEmitter();

        const apiEndpointClient = new APIEndpointClient(mockSocket, 'ep1');

        const handler = () => {
            t.fail();
        };

        apiEndpointClient.on('testEvent', handler);
        apiEndpointClient.off('testEvent', handler);

        mockSocket.emit('emitEvent.ep1', 'testEvent', []);

        setTimeout(resolve, 50);
    });
});

test('Emits disconnectEndpointConnection on disconnect', t => {
    return new Promise(resolve => {
        const mockEE = new EventEmitter();

        mockEE.on('disconnectEndpointConnection', () => {
            t.pass();
            resolve();
        });

        const apiEndpoint = new APIEndpointClient(mockEE, 'epid');

        apiEndpoint.disconnect();
    });
});

test('Throws timeout error if endpoint doesnt resolve within timeout', async t => {
    const mockSocket = new EventEmitter();

    mockSocket.on('callEndpointFunction', (endpointConnectionId: string, actionName: string, args: any, cb: (errorMessage: string, res: any) => void) => {
        if (actionName === 'fast') {
            return cb(null, { val: 'Hello world!' });
        }

        if (actionName === 'slow') {
            setTimeout(() => {
                cb(null, { val: 'Hello world!' });
            }, 100);
        }

        if (actionName === 'tooslow') {
            setTimeout(() => {
                cb(null, { val: 'Hello world!' });
            }, 300);
        }

        if (actionName === 'never') {
            return;
        }
    });

    const apiEndpointClient = new APIEndpointClient(mockSocket, 'ep1');
    apiEndpointClient.timeout = 200;

    const response1 = await apiEndpointClient.callAction('fast');
    t.deepEqual(response1, { val: 'Hello world!' });

    const response2 = await apiEndpointClient.callAction('slow');
    t.deepEqual(response2, { val: 'Hello world!' });

    try {
        await apiEndpointClient.callAction('tooslow');
        t.fail();
    } catch(e) {
        t.is(e.message, 'callAction(\'tooslow\', {}) timed out');
        t.pass();
    }

    try {
        await apiEndpointClient.callAction('never', { val: 1 });
        t.fail();
    } catch(e) {
        t.is(e.message, 'callAction(\'never\', {"val":1}) timed out');
        t.pass();
    }

});