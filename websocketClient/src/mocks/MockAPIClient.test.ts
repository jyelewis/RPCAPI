import test from 'ava'
import {MockAPIClient} from "./MockAPIClient";
import {MockAPIEndpointClient} from "./MockAPIEndpointClient";

test('Fake connects without trying to connect to socket', async t => {
    const mockAPIClient = new MockAPIClient({
        endpoints: {
            testEndpoint: {
                actions: {}
            }
        }
    });

    await mockAPIClient.connect();
    t.pass();
});

test('Throws if attempting to call an endpoint before connecting', async t => {
    const mockAPIClient = new MockAPIClient({
        endpoints: {
            testEndpoint: {
                actions: {}
            }
        }
    });

    try {
        await mockAPIClient.connectToEndpoint('blah');
        t.fail();
    } catch(e) {
        t.is(e.message, 'Cannot connect to endpoint before socket connection is established');
        t.pass();
    }
});

test('Throws if attempting to connect while already connected', async t => {
    const mockAPIClient = new MockAPIClient({
        endpoints: {
            testEndpoint: {
                actions: {}
            }
        }
    });

    await mockAPIClient.connect();

    try {
        await mockAPIClient.connect();
        t.fail();
    } catch(e) {
        t.is(e.message, 'Already connected to server');
        t.pass();
    }
});

test('Creates a mock endpoint when connecting', async t => {
    const mockAPIClient = new MockAPIClient({
        endpoints: {
            testEndpoint: {
                actions: {
                    testAction: () => {}
                }
            }
        }
    });

    await mockAPIClient.connect();

    const mockEP = await mockAPIClient.connectToEndpoint('testEndpoint');
    t.true(mockEP instanceof MockAPIEndpointClient);
});

test('Throws if connecting to an endpoint not defined in the mocks', async t => {
    const mockAPIClient = new MockAPIClient({
        endpoints: {
        }
    });

    await mockAPIClient.connect();

    try {
        await mockAPIClient.connectToEndpoint('dontExist');
        t.fail();
    } catch(e) {
        t.is(e.message, 'Unable to create endpoint connection, \'dontExist\' does not exist');
        t.pass();
    }
});

test('Returned mock endpoint calls given mock function', async t => {
    const mockAPIClient = new MockAPIClient({
        endpoints: {
            testEndpoint: {
                actions: {
                    testAction: () => {
                        t.pass();
                        return {};
                    }
                }
            }
        }
    });

    await mockAPIClient.connect();

    const mockEP = await mockAPIClient.connectToEndpoint('testEndpoint');
    await mockEP.callAction('testAction');
});
