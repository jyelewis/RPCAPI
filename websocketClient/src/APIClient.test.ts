import test from 'ava'
import {APIClient} from "./APIClient";
import {EventEmitter} from "./util/EventEmitter";

test('Requests an endpoint connection', async t => {
    const mockEE = new EventEmitter();

    mockEE.on('connectToEndpoint', (endpointName: string, cb: (errorMessage: string, endpointConnectionId: string) => void) => {
        t.is(endpointName, 'testep');
        cb(null, 'epcid');
    });

    const apiClient = new APIClient('');

    setTimeout(() => mockEE.emit('serverReady'), 10);
    await apiClient.mockSocket(mockEE);

    const apiEndpointClient = await apiClient.connectToEndpoint('testep');
    t.is(apiEndpointClient.endpointConnectionId, 'epcid');
});

test('Throws if endpoint connection response contains an error', async t => {
    const mockEE = new EventEmitter();

    mockEE.on('connectToEndpoint', (endpointName: string, cb: (errorMessage: string, endpointConnectionId: string) => void) => {
        t.is(endpointName, 'testep');
        cb('some error', null);
    });

    const apiClient = new APIClient('');

    setTimeout(() => mockEE.emit('serverReady'), 10);
    await apiClient.mockSocket(mockEE);

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
    apiClient.connectionTimeout = 100;

    try {
        await apiClient.mockSocket(mockEE);
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