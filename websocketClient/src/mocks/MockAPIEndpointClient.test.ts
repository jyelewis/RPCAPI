import test from 'ava'
import {MockAPIEndpointClient} from "./MockAPIEndpointClient";
import {delay} from "../util/delay";

test('Calls mock endpoint and returns value', async t => {
    const mockAPIEndpointClient = new MockAPIEndpointClient({
        actions: {
            testAction: () => {
                return { a: 1 };
            },
            otherAction: () => {
                return { a: 2 };
            }
        }
    });

    const result1 = await mockAPIEndpointClient.callAction('testAction');
    t.deepEqual(result1, { a: 1 });

    const result2 = await mockAPIEndpointClient.callAction('otherAction');
    t.deepEqual(result2, { a: 2 });
});


test('Passes args to mocked endpoint', async t => {
    const mockAPIEndpointClient = new MockAPIEndpointClient({
        actions: {
            add: ({ a, b }: { a: number, b: number }) => {
                return { result: a + b };
            }
        }
    });

    const result1 = await mockAPIEndpointClient.callAction('add', { a: 1, b: 2 });
    t.deepEqual(result1, { result: 3 });

    const result2 = await mockAPIEndpointClient.callAction('add', { a: 13, b: 8 });
    t.deepEqual(result2, { result: 21 });
});

test('Waits for an async endpoint to resolve', async t => {
    const mockAPIEndpointClient = new MockAPIEndpointClient({
        actions: {
            slow: async () => {
                await delay(10);
                return { done: true };
            }
        }
    });

    const result1 = await mockAPIEndpointClient.callAction('slow');
    t.deepEqual(result1, { done: true });
});

test('Simulates server sent events', async t => {
    const mockAPIEndpointClient = new MockAPIEndpointClient({
        actions: {}
    });

    mockAPIEndpointClient.on('testEvent', () => {
        t.pass();
    });

    mockAPIEndpointClient.simulateServerSentEvent('testEvent');

    await delay(10); //Give event emitter time
});

test('Passes args with server sent events', async t => {
    const mockAPIEndpointClient = new MockAPIEndpointClient({
        actions: {}
    });

    mockAPIEndpointClient.on('testEvent', (a: number, b: number) => {
        t.is(a, 123);
        t.is(b, 456);
        t.pass();
    });

    mockAPIEndpointClient.simulateServerSentEvent('testEvent', 123, 456);

    await delay(10); //Give event emitter time
});

test('Throws if calling an action not defined in the mocks', async t => {
    const mockAPIEndpointClient = new MockAPIEndpointClient({
        actions: {}
    });

    try {
        await mockAPIEndpointClient.callAction('dontExist');
        t.fail();
    } catch(e) {
        t.is(e.message, 'Action \'dontExist\' does not exist');
        t.pass();
    }
});

test('Throws if action in mocks has an error', async t => {
    const mockAPIEndpointClient = new MockAPIEndpointClient({
        actions: {
            throwsError: () => {
                throw new Error('Test error');
            }
        }
    });

    mockAPIEndpointClient.printMockFunctionErrors = false;

    try {
        await mockAPIEndpointClient.callAction('throwsError');
        t.fail();
    } catch(e) {
        t.is(e.message, 'Internal server error (While mocking action \'throwsError\')');
        t.pass();
    }
});

test('Throws if action in mocks does not return an object', async t => {
    const mockAPIEndpointClient = new MockAPIEndpointClient({
        actions: {
            doesntReturnObject: () => {
                return 1;
            }
        }
    });

    try {
        await mockAPIEndpointClient.callAction('doesntReturnObject');
        t.fail();
    } catch(e) {
        t.is(e.message, 'Action \'doesntReturnObject\' did not return an object');
        t.pass();
    }
});

