import test from 'ava'

import { API } from './API'
import { APIEndpoint } from './APIEndpoint'
import {Express} from "express";
import * as SocketIO from "socket.io";
import * as http from "http";

test('Registers and returns endpoint', async t => {
    class TestEndpoint1 extends APIEndpoint {}
    class TestEndpoint2 extends APIEndpoint {}

    const api = new API();
    api.registerEndpoint('test1', TestEndpoint1);
    api.registerEndpoint('test2', TestEndpoint2);

    const inst1 = api.getEndpoint('test1');
    t.true(inst1 instanceof TestEndpoint1);

    const inst2 = api.getEndpoint('test2');
    t.true(inst2 instanceof TestEndpoint2);

    const inst3 = api.getEndpoint('test1');
    t.true(inst3 instanceof TestEndpoint1);
    t.true(inst3 !== inst1);
});

test('Returns null if endpoint doesnt exist', async t => {
    const api = new API();

    t.is(null, api.getEndpoint('doesntExist'));
});

test('Allows using a custom ep constructor', async t => {
    class TestEndpoint1 extends APIEndpoint {
        public setMe: number = 0;
    }

    const api = new API();

    api.customCreateEndpointInstance = function(epClass: typeof APIEndpoint) {
        const ep = new epClass();
        (<TestEndpoint1>ep).setMe = 1;
        return ep;
    };


    api.registerEndpoint('test1', TestEndpoint1);

    const inst1 = <TestEndpoint1>api.getEndpoint('test1');
    t.true(inst1 instanceof TestEndpoint1);
    t.is(inst1.setMe, 1);
});

test('Endpoint names are case insensitive', async t => {
    class TestEndpoint extends APIEndpoint {}

    const api = new API();
    api.registerEndpoint('test-1', TestEndpoint);
    api.registerEndpoint('TEST-2', TestEndpoint);
    api.registerEndpoint('TesT-3', TestEndpoint);


    const inst1 = api.getEndpoint('TEST-1');
    t.true(inst1 instanceof TestEndpoint);

    const inst2 = api.getEndpoint('test-2');
    t.true(inst2 instanceof TestEndpoint);

    const inst3 = api.getEndpoint('TEst-3');
    t.true(inst3 instanceof TestEndpoint);
});

test('Validates endpoint name on register', async t => {
    class TestEndpoint extends APIEndpoint {}

    const api = new API();

    t.notThrows(() =>
        api.registerEndpoint('test-1', TestEndpoint)
    );

    t.notThrows(() =>
        api.registerEndpoint('TEST.2', TestEndpoint)
    );

    t.notThrows(() =>
        api.registerEndpoint('TesT_3', TestEndpoint)
    );

    t.throws(
        () => api.registerEndpoint('test 1', TestEndpoint)
    );

    t.throws(
        () => api.registerEndpoint('test&', TestEndpoint)
    );
});

test('Calls static configureServer on endpoint when setting up, if available', async t => {
    class TestEndpoint extends APIEndpoint {
        public static configureServer(app: Express, io: SocketIO.Server, server: http.Server) {
            t.pass();
        }
    }

    const api = new API();
    api.registerEndpoint('test', TestEndpoint);

    await api.listen(65432);
});