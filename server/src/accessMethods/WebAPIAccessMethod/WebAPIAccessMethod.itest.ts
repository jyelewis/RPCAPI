import test from 'ava';

import {APIEndpoint} from "../../APIEndpoint";
import {API} from "../../API";
import fetch from "node-fetch";
import {AccessDeniedError} from "../../errorTypes";

test.before(async () => {
    class TestEndpoint extends APIEndpoint {
        $sayHello() {
            return { hello: 'world' };
        }

        $requiresAuth() {
            if (this.accessKey !== 'myAccessKey') {
                throw new AccessDeniedError('Invalid access key');
            }

            return { hello: 'world' };
        }

        $addParams = { a: 'number', b: 'number' };
        $add({a, b} : {a: number, b: number}) {
            return { value: a + b };
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    testAPI.registerEndpoint('endpoint/with/many/slashes', TestEndpoint);

    await testAPI.listen(8057, {
        webApi: {
            outputActionErrors: false
        }
    });
});

test('Calls action via webapi url', async t => {
    const res = await fetch('http://localhost:8057/api/test/sayHello', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });

    t.is(res.status, 200);
    t.deepEqual(await res.json(), { error: null, result: { hello: 'world' } });
});

test('Allows slashes in the endpoint url', async t => {
    const res = await fetch('http://localhost:8057/api/endpoint/with/many/slashes/sayHello', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });

    t.is(res.status, 200);
    t.deepEqual(await res.json(), { error: null, result: { hello: 'world' } });
});

test('Gives error if AccessDeniedError is throw in action', async t => {
    const res1 = await fetch('http://localhost:8057/api/test/requiresAuth', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            accessKey: 'myAccessKey'
        })
    });

    t.is(res1.status, 200);
    t.deepEqual(await res1.json(), { error: null, result: { hello: 'world' } });


    const res2 = await fetch('http://localhost:8057/api/test/requiresAuth', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            accessKey: 'invalidaccesskey'
        })
    });

    t.is(res2.status, 401);
    t.deepEqual(await res2.json(), { error: 'Invalid access key', result: null });
});

test('Reads parameters from json encoded body', async t => {
    const res1 = await fetch('http://localhost:8057/api/test/add', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            a: 3,
            b: 7
        })
    });

    t.is(res1.status, 200);
    t.deepEqual(await res1.json(), { error: null, result: { value: 10 } });
});

test('reads parameters from urlencoded body', async t => {
    const res1 = await fetch('http://localhost:8057/api/test/add', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'a=3&b=7'
    });

    t.is(res1.status, 200);
    t.deepEqual(await res1.json(), { error: null, result: { value: 10 } });
});

test('Allows authenticating via Bearer header', async t => {
    const res1 = await fetch('http://localhost:8057/api/test/requiresAuth', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            "Authorization": "Bearer myAccessKey"
        }
    });

    t.is(res1.status, 200);
    t.deepEqual(await res1.json(), { error: null, result: { hello: 'world' } });

    const res2 = await fetch('http://localhost:8057/api/test/requiresAuth', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            "Authorization": "Bearer invalidaccesskey"
        }
    });

    t.is(res2.status, 401);
    t.deepEqual(await res2.json(), { error: 'Invalid access key', result: null });
});
