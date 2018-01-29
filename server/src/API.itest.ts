import test from 'ava'

import { API } from './API'
import { APIEndpoint } from './APIEndpoint'

import fetch from 'node-fetch';
import * as ioClient from 'socket.io-client'

test.before('Setup server', async t => {
    class TestEndpoint extends APIEndpoint {
        $test() {
            return {
                hello: 'world'
            };
        }
    }

    const api = new API();
    api.registerEndpoint('test', TestEndpoint);

    await api.listen(8258);
});

test('Serves webapi requests from built in server', async t => {
    const response = await fetch('http://localhost:8258/api/test/test');
    //console.log(response);
    t.is(response.status, 200);
    t.deepEqual(await response.json(), { error: null, result: { hello: 'world' } });
});

test('Serves websocket requests from built in server', async t => {
    return new Promise(resolve => {
        const socket = ioClient.connect('http://localhost:8258');
        socket.on('serverReady', () => {
            t.pass();
            resolve();
        });
    });
});
