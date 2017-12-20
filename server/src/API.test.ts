import test from 'ava'

import { API } from './API'
import { APIEndpoint } from './APIEndpoint'

test('Registers and returns endpoint', async t => {
    class TestEndpoint1 extends APIEndpoint {}
    class TestEndpoint2 extends APIEndpoint {}

    const api = new API();
    api.registerEndpoint('test 1', TestEndpoint1);
    api.registerEndpoint('test 2', TestEndpoint2);

    const inst1 = api.getEndpoint('test 1');
    t.true(inst1 instanceof TestEndpoint1);

    const inst2 = api.getEndpoint('test 2');
    t.true(inst2 instanceof TestEndpoint2);

    const inst3 = api.getEndpoint('test 1');
    t.true(inst3 instanceof TestEndpoint1);
    t.true(inst3 !== inst1);
});

test('Returns null if endpoint doesnt exist', async t => {
    const api = new API();

    t.is(null, api.getEndpoint('doesntExist'));
});

test('Endpoint names are case insensitive', async t => {
    class TestEndpoint extends APIEndpoint {}

    const api = new API();
    api.registerEndpoint('test 1', TestEndpoint);
    api.registerEndpoint('TEST 2', TestEndpoint);
    api.registerEndpoint('TesT 3', TestEndpoint);


    const inst1 = api.getEndpoint('TEST 1');
    t.true(inst1 instanceof TestEndpoint);

    const inst2 = api.getEndpoint('test 2');
    t.true(inst2 instanceof TestEndpoint);

    const inst3 = api.getEndpoint('TEst 3');
    t.true(inst3 instanceof TestEndpoint);
});
