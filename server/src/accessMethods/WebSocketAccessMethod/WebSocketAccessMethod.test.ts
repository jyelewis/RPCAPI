import test from 'ava';

import {API} from '../../API'
import {WebSocketAccessMethod} from './index'
import {APIEndpoint} from "../../APIEndpoint";

test('Calls connect() when new endpoint is created', async t => {
    let hasCalled: boolean = false;

    class TestEndpoint extends APIEndpoint {
        connect() {
            hasCalled = true;
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebSocketAccessMethod(testApi);

    accessMethod.createNewSocketEndpoint('mySocketID', 'test');

    t.is(hasCalled, true);
});

test('Calls disconnect() when socket disconnects', async t => {
    let hasCalled1: boolean = false;
    let hasCalled2: boolean = false;

    class TestEndpoint1 extends APIEndpoint {
        disconnect() {
            hasCalled1 = true;
        }
    }
    class TestEndpoint2 extends APIEndpoint {
        disconnect() {
            hasCalled2 = true;
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test1', TestEndpoint1);
    testApi.registerEndpoint('test2', TestEndpoint2);

    const accessMethod = new WebSocketAccessMethod(testApi);

    accessMethod.createNewSocketEndpoint('mySocketID', 'test1');
    accessMethod.createNewSocketEndpoint('mySocketID', 'test2');

    accessMethod.disconnectAllSocketEndpoints('mySocketID');

    t.is(hasCalled1, true);
    t.is(hasCalled2, true);
});

test('Calling socket endpoint after disconnecting fails', async t => {
    class TestEndpoint extends APIEndpoint {
        $test() {
            return { done: true };
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebSocketAccessMethod(testApi);

    const endpointConnection = accessMethod.createNewSocketEndpoint('mySocketID', 'test');

    //Make sure we can call before disconnect without throwing
    await accessMethod.callEndpointAction('mySocketID', endpointConnection.endpointConnectionId, 'test', {});

    accessMethod.disconnectAllSocketEndpoints('mySocketID');

    try {
        await accessMethod.callEndpointAction('mySocketID', endpointConnection.endpointConnectionId, 'test', {});
        t.fail('callEndpointAction() after disconnect did not throw');
    } catch(e) {
        t.pass();
    }
});

test('Disconnecting a socket cleans up all endpoints', async t => {
    class TestEndpoint1 extends APIEndpoint {
        $test() {
            return { done: true };
        }
    }
    class TestEndpoint2 extends APIEndpoint {
        $test() {
            return { done: true };
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test1', TestEndpoint1);
    testApi.registerEndpoint('test2', TestEndpoint2);

    const accessMethod = new WebSocketAccessMethod(testApi);

    t.is(accessMethod.numberOfActiveConnections(), 0);

    accessMethod.createNewSocketEndpoint('mySocketID1', 'test1');
    accessMethod.createNewSocketEndpoint('mySocketID1', 'test2');
    t.is(accessMethod.numberOfActiveConnections(), 2);

    const endpointConnection = accessMethod.createNewSocketEndpoint('mySocketID2', 'test1');
    t.is(accessMethod.numberOfActiveConnections(), 3);

    //Make sure we can call before disconnect without throwing
    await accessMethod.callEndpointAction('mySocketID2', endpointConnection.endpointConnectionId, 'test', {});

    accessMethod.disconnectAllSocketEndpoints('mySocketID2');
    t.is(accessMethod.numberOfActiveConnections(), 2);

    accessMethod.disconnectAllSocketEndpoints('mySocketID1');
    t.is(accessMethod.numberOfActiveConnections(), 0);
});

test('disconnectEndpointConnection() calls disconnect on endpoint', async t => {
    class TestEndpoint extends APIEndpoint {
        $test() {
            return { done: true };
        }

        disconnect() {
            t.pass();
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebSocketAccessMethod(testApi);

    const endpointConnection = accessMethod.createNewSocketEndpoint('mySocketID', 'test');

    //Make sure we can call before disconnect without throwing
    await accessMethod.callEndpointAction('mySocketID', endpointConnection.endpointConnectionId, 'test', {});

    accessMethod.disconnectEndpointConnection('mySocketID', endpointConnection.endpointConnectionId);
});

test('disconnectEndpointConnection() garbage collects endpoint', async t => {
    class TestEndpoint extends APIEndpoint {
        $test() {
            return { done: true };
        }

        disconnect() {
            t.pass();
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebSocketAccessMethod(testApi);

    t.is(accessMethod.numberOfActiveConnections(), 0);

    const endpointConnection = accessMethod.createNewSocketEndpoint('mySocketID', 'test');
    t.is(accessMethod.numberOfActiveConnections(), 1);

    //Make sure we can call before disconnect without throwing
    await accessMethod.callEndpointAction('mySocketID', endpointConnection.endpointConnectionId, 'test', {});

    accessMethod.disconnectEndpointConnection('mySocketID', endpointConnection.endpointConnectionId);
    t.is(accessMethod.numberOfActiveConnections(), 0);
});

test('disconnectEndpointConnection() fails if endpoint doesnt belong to given socket', async t => {
    class TestEndpoint extends APIEndpoint {
        $test() {
            return { done: true };
        }

        disconnect() {
            t.fail('Disconnect was called');
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebSocketAccessMethod(testApi);

    t.is(accessMethod.numberOfActiveConnections(), 0);

    const endpointConnection = accessMethod.createNewSocketEndpoint('mySocketID', 'test');
    t.is(accessMethod.numberOfActiveConnections(), 1);

    //Make sure we can call before disconnect without throwing
    await accessMethod.callEndpointAction('mySocketID', endpointConnection.endpointConnectionId, 'test', {});

    try {
        accessMethod.disconnectEndpointConnection('notMySocketID', endpointConnection.endpointConnectionId);
        t.fail('Did not throw');
    } catch(e) {
        t.pass();
    }
});

test('Calls action', async t => {
    let hasCalled: boolean = false;

    class TestEndpoint extends APIEndpoint {
        $testFunc() {
            hasCalled = true;
            return { done: true };
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebSocketAccessMethod(testApi);

    const endpointConnection = accessMethod.createNewSocketEndpoint('mySocketID', 'test');
    const retVal = await accessMethod.callEndpointAction(
        'mySocketID',
        endpointConnection.endpointConnectionId,
        'testFunc',
        {}
    );

    t.deepEqual(retVal, { done: true });
    t.is(hasCalled, true);
});

test('callAction() fails if endpoint doesnt belong to socket', async t => {
    class TestEndpoint extends APIEndpoint {
        $testFunc() {
            return { done: true };
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebSocketAccessMethod(testApi);

    const endpointConnection = accessMethod.createNewSocketEndpoint('mySocketID', 'test');

    try {
        await accessMethod.callEndpointAction(
            'notMySocketID',
            endpointConnection.endpointConnectionId,
            'testFunc',
            {}
        );
        t.fail('Did not throw');
    } catch(e) {
        t.pass();
    }
});

test('Passes param to action', async t => {
    t.plan(2);

    class TestEndpoint extends APIEndpoint {
        $testFuncParams = { a: 'string' };
        $testFunc({ a }: { a: string }) {
            t.is(a, 'asdf');

            return { done: true };
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebSocketAccessMethod(testApi);

    const endpointConnection = accessMethod.createNewSocketEndpoint('mySocketID', 'test');
    const retVal = await accessMethod.callEndpointAction(
        'mySocketID',
        endpointConnection.endpointConnectionId,
        'testFunc',
        { a: 'asdf' }
    );

    t.deepEqual(retVal, { done: true });
});

test('Doesn\'t pass unspecified params', async t => {
    t.plan(3);

    class TestEndpoint extends APIEndpoint {
        $testFuncParams = { valid: 'string' };
        $testFunc({ valid, invalid }: { valid: string, invalid: string }) {
            t.is(valid, 'asdf');
            t.is(typeof invalid, 'undefined');

            return { done: true };
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebSocketAccessMethod(testApi);

    const endpointConnection = accessMethod.createNewSocketEndpoint('mySocketID', 'test');
    const retVal = await accessMethod.callEndpointAction(
        'mySocketID',
        endpointConnection.endpointConnectionId,
        'testFunc',
        { valid: 'asdf', invalid: 'asdf' }
    );

    t.deepEqual(retVal, { done: true });
});

test('Throws if params are not the correct type', async t => {
    class TestEndpoint extends APIEndpoint {
        $testFuncParams = { str: 'string', num: 'number' };
        $testFunc() {
            return { done: true };
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebSocketAccessMethod(testApi);

    const endpointConnection = accessMethod.createNewSocketEndpoint('mySocketID', 'test');

    try {
        await accessMethod.callEndpointAction(
            'mySocketID',
            endpointConnection.endpointConnectionId,
            'testFunc',
            {str: 123, num: 'asdf'}
        );
        t.fail('Didn\'t throw');
    } catch(e) {
        t.pass();
    }
});
