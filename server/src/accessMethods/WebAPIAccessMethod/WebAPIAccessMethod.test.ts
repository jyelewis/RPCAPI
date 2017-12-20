import test from 'ava';

import {API} from '../../API'
import {WebAPIAccessMethod} from './index'
import {APIEndpoint} from "../../APIEndpoint";
import {delay} from "../../util/delay";

test('Calls endpoint', async t => {
    let hasCalled: boolean = false;

    class TestEndpoint extends APIEndpoint {
        $testFunc() {
            hasCalled = true;
            return { done: true };
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebAPIAccessMethod(testApi);

    const retVal = await accessMethod.processRequest('test', 'testFunc', {});

    t.deepEqual(retVal, { done: true });
    t.is(hasCalled, true);
});

test('Converts types', async t => {
    class TestEndpoint extends APIEndpoint {
        $testFuncParams = { num: 'number', str: 'string', arr: 'array', obj: 'object' };
        $testFunc({num, str, arr, obj}: { num: number, str: string, arr: number[], obj: any }) {
            t.is(typeof num, 'number');
            t.is(typeof str, 'string');
            t.is(typeof arr, 'object');
            t.is(typeof obj, 'object');
            t.true(Array.isArray(arr));

            return {
                response: num
            };
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebAPIAccessMethod(testApi);

    const retVal = await accessMethod.processRequest('test', 'testFunc', {
        num: '123',
        str: 'Hello world',
        arr: '[1, 2, 3, 4]',
        obj: '{ "a": 1, "b": 2 }'
    });

    t.deepEqual(retVal, { response: 123 });
});

test('Doesn\'t pass values that are not defined in params', async t => {
    class TestEndpoint extends APIEndpoint {
        $testFuncParams = { validParam: 'string' };
        $testFunc({ validParam, hackParam }: { validParam: string, hackParam: any }) {
            t.is(typeof validParam, 'string');
            t.is(typeof hackParam, 'undefined');
            t.is(validParam, 'Hello world!');

            return { done: true };
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebAPIAccessMethod(testApi);

    const retVal = await accessMethod.processRequest('test', 'testFunc', {
        validParam: 'Hello world!',
        hackParam: 'Haxx'
    });

    t.deepEqual(retVal, { done: true });
});

test('Waits for connect() to complete before executing action', async t => {
    let hasConnected = false;

    class TestEndpoint extends APIEndpoint {
        async connect() {
            await delay(10);
            hasConnected = true;
        }

        $testFunc() {
            t.true(hasConnected);
            return { done: true };
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebAPIAccessMethod(testApi);

    await accessMethod.processRequest('test', 'testFunc', {});
});

test('Calls disconnect() in background after executing action', async t => {
    let hasDisconnected = false;

    class TestEndpoint extends APIEndpoint {
        async disconnect() {
            await delay(10);
            hasDisconnected = true;
        }

        $testFunc() {
            return { done: true };
        }
    }

    const testApi = new API();
    testApi.registerEndpoint('test', TestEndpoint);

    const accessMethod = new WebAPIAccessMethod(testApi);

    await accessMethod.processRequest('test', 'testFunc', {});
    t.false(hasDisconnected);

    await delay(20);

    t.true(hasDisconnected);
});
