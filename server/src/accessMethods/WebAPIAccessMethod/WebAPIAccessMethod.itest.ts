import test from 'ava';

import {WebAPIAccessMethod} from './index'
import * as express from "express";
import * as http from "http";
import {APIEndpoint} from "../../APIEndpoint";
import {API} from "../../API";
import fetch from "node-fetch";
import {AccessDeniedError} from "../../errorTypes";

let server: http.Server;

test.before(() => {
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
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    testAPI.registerEndpoint('endpoint/with/many/slashes', TestEndpoint);

    const app = express();
    server = new http.Server(app);

    //Setup access methods
    const webapiAM = new WebAPIAccessMethod(testAPI);
    webapiAM.outputActionErrors = false;

    webapiAM.bind(app);

    //server listen
    server.listen(8057);
});

test.after(async t => {
    server.close();
});

test('Calls action via webapi url', async t => {
    const res = await fetch('http://localhost:8057/api/test/sayHello');
    t.is(res.status, 200);
    t.deepEqual(await res.json(), { error: null, result: { hello: 'world' } });
});

test('Allows slashes in the endpoint url', async t => {
    const res = await fetch('http://localhost:8057/api/endpoint/with/many/slashes/sayHello');

    t.is(res.status, 200);
    t.deepEqual(await res.json(), { error: null, result: { hello: 'world' } });
});

test('Gives error if AccessDeniedError is throw in action', async t => {
    const res1 = await fetch('http://localhost:8057/api/test/requiresAuth?accessKey=myAccessKey');

    t.is(res1.status, 200);
    t.deepEqual(await res1.json(), { error: null, result: { hello: 'world' } });


    const res2 = await fetch('http://localhost:8057/api/test/requiresAuth?accessKey=invalidaccesskey');

    t.is(res2.status, 401);
    t.deepEqual(await res2.json(), { error: 'Invalid access key', result: null });
});
