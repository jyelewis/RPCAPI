import test from 'ava'
import {APIClient} from "./APIClient";
import {EventEmitter} from "./util/EventEmitter";

test('Requests an endpoint connection', async t => {
    const mockEE = new EventEmitter();

    mockEE.on('connectToEndpoint', (endpointName: string, accessKey: string, cb: (errorMessage: string, endpointConnectionId: string) => void) => {
        t.is(endpointName, 'testep');
        cb(null, 'epcid');
    });

    const apiClient = new APIClient('');

    setTimeout(() => mockEE.emit('serverReady'), 10);
    await apiClient.mockSocketConnect(mockEE);

    const apiEndpointClient = await apiClient.connectToEndpoint('testep');
    t.is(apiEndpointClient.endpointConnectionId, 'epcid');
});

test('Passes accessKey when requesting an endpoint connection', async t => {
    const mockEE = new EventEmitter();

    mockEE.on('connectToEndpoint', (endpointName: string, accessKey: string, cb: (errorMessage: string, endpointConnectionId: string) => void) => {
        t.is(accessKey, 'myAccessKey');
        cb(null, 'epcid');
    });

    const apiClient = new APIClient('');

    setTimeout(() => mockEE.emit('serverReady'), 10);
    await apiClient.mockSocketConnect(mockEE);

    const apiEndpointClient = await apiClient.connectToEndpoint('testep', 'myAccessKey');
    t.is(apiEndpointClient.endpointConnectionId, 'epcid');
});

test('Passes connection level accessKey if set when requesting an endpoint connection', async t => {
    const mockEE = new EventEmitter();

    mockEE.on('connectToEndpoint', (endpointName: string, accessKey: string, cb: (errorMessage: string, endpointConnectionId: string) => void) => {
        t.is(accessKey, 'myAccessKey');
        cb(null, 'epcid');
    });

    const apiClient = new APIClient('');
    apiClient.accessKey = 'myAccessKey';

    setTimeout(() => mockEE.emit('serverReady'), 10);
    await apiClient.mockSocketConnect(mockEE);

    const apiEndpointClient = await apiClient.connectToEndpoint('testep');
    t.is(apiEndpointClient.endpointConnectionId, 'epcid');
});

test('Prefers specified access key to connection level, if specified', async t => {
    const mockEE = new EventEmitter();

    mockEE.on('connectToEndpoint', (endpointName: string, accessKey: string, cb: (errorMessage: string, endpointConnectionId: string) => void) => {
        t.is(accessKey, 'myAccessKey2');
        cb(null, 'epcid');
    });

    const apiClient = new APIClient('');
    apiClient.accessKey = 'myAccessKey1';

    setTimeout(() => mockEE.emit('serverReady'), 10);
    await apiClient.mockSocketConnect(mockEE);

    const apiEndpointClient = await apiClient.connectToEndpoint('testep', 'myAccessKey2');
    t.is(apiEndpointClient.endpointConnectionId, 'epcid');
});

test('Throws if endpoint connection response contains an error', async t => {
    const mockEE = new EventEmitter();

    mockEE.on('connectToEndpoint', (endpointName: string, accessKey: string, cb: (errorMessage: string, endpointConnectionId: string) => void) => {
        t.is(endpointName, 'testep');
        cb('some error', null);
    });

    const apiClient = new APIClient('');

    setTimeout(() => mockEE.emit('serverReady'), 10);
    await apiClient.mockSocketConnect(mockEE);

    try {
        await apiClient.connectToEndpoint('testep');
        t.fail('Didnt throw');
    } catch(e) {
        t.pass();
    }
});

test('Throws if server does not respond after connecting', async t => {
    const mockEE = new EventEmitter();

    const apiClient = new APIClient('');
    apiClient.timeout = 100;

    try {
        await apiClient.mockSocketConnect(mockEE);
        t.fail();
    } catch(e) {
        t.pass();
    }
});

test('Throws if attempting to connect to an endpoint before connecting to a socket', async t => {
    const apiClient = new APIClient('');

    try {
        await apiClient.connectToEndpoint('test');
        t.fail('Didnt throw');
    } catch(e) {
        t.pass();
    }
});

test('Throws timeout error if connectToEndpoint doesnt resolve within timeout', async t => {
    const mockEE = new EventEmitter();

    mockEE.on('connectToEndpoint', (endpointName: string, accessKey: string, cb: (errorMessage: string, endpointConnectionId: string) => void) => {
        if (endpointName === 'fast') {
            return cb(null, 'epcid');
        }

        if (endpointName === 'slow') {
            setTimeout(() => {
                cb(null, 'epcid');
            }, 100);
        }

        if (endpointName === 'tooslow') {
            setTimeout(() => {
                cb(null, 'epcid');
            }, 300);
        }

        if (endpointName === 'never') {
            return;
        }

    });

    const apiClient = new APIClient('');
    apiClient.timeout = 200;

    setTimeout(() => mockEE.emit('serverReady'), 10);
    await apiClient.mockSocketConnect(mockEE);

    await apiClient.connectToEndpoint('fast');

    await apiClient.connectToEndpoint('slow');

    try {
        await apiClient.connectToEndpoint('tooslow');
        t.fail();
    } catch(e) {
        t.is(e.message, 'connectToEndpoint(\'tooslow\') timed out');
        t.pass();
    }

    try {
        await apiClient.connectToEndpoint('never');
        t.fail();
    } catch(e) {
        t.is(e.message, 'connectToEndpoint(\'never\') timed out');
        t.pass();
    }
});