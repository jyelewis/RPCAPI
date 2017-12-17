import test from 'ava'
import fetch from 'node-fetch'
//Starts up a real web server and hits it

import * as express from 'express'
import * as http from 'http'

import { WebAPIAccessMethod } from '../accessMethods/WebAPIAccessMethod/index'
import {API} from "../API";
import {CalculatorEndpoint} from "../testEndpoints/CalculatorEndpoint";

test.before(async () => {
    const app = express();
    const server = new http.Server(app);

    //set api
    const api = new API();
    api.registerEndpoint('calculator', CalculatorEndpoint);

    //Setup access methods
    const webApi = new WebAPIAccessMethod(api, { prefix: '/api' });
    webApi.outputActionErrors = false;
    webApi.bind(app);

    //server listen
    await new Promise(resolve =>
        server.listen(55536, resolve)
    );
});

test('API Responds to action', async t => {
    const res = await fetch('http://localhost:55536/api/calculator/add?a=1&b=2');
    t.is(res.status, 200);
});

test('API gives 404 when endpoint doesnt exist', async t => {
    const res = await fetch('http://localhost:55536/api/asdf/add?a=1&b=2');
    t.is(res.status, 404);
});

test('API gives 404 when action doesnt exist', async t => {
    const res = await fetch('http://localhost:55536/api/calculator/asdf?a=1&b=2');
    t.is(res.status, 404);
});

test('API responds with return value and empty error', async t => {
    const res = await fetch('http://localhost:55536/api/calculator/add?a=1&b=2');
    t.is(res.status, 200);
    t.deepEqual(await res.json(), { error: null, result: { value: 3 } });
});

test('API waits for an async action to complete', async t => {
    const res = await fetch('http://localhost:55536/api/calculator/slowAdd?a=1&b=2');
    t.is(res.status, 200);
    t.deepEqual(await res.json(), { error: null, result: { value: 3 } });
});

test('API responds with error if arguments are an incorrect type', async t => {
    const res = await fetch('http://localhost:55536/api/calculator/add?a=a&b=2');
    t.is(res.status, 400);
    t.deepEqual(await res.json(), { error: 'Expected param \'a\' to be a number, but it was not', result: null });
});

test('API responds with error if arguments are missing', async t => {
    const res = await fetch('http://localhost:55536/api/calculator/add?b=2');
    t.is(res.status, 400);
    t.deepEqual(await res.json(), { error: 'Expected param \'a\' to be given, but it was not', result: null });
});

test('API responds with error an internal server error occurs', async t => {
    const res = await fetch('http://localhost:55536/api/calculator/throws');
    t.is(res.status, 500);
    t.deepEqual(await res.json(), { error: 'Internal server error', result: null });
});

test('API accepts boolean values', async t => {
    const res = await fetch('http://localhost:55536/api/calculator/specialAdd?a=5&b=7&strAdd=false');
    t.is(res.status, 200);
    t.deepEqual(await res.json(), { error: null, result: { value: 12 } });

    const res2 = await fetch('http://localhost:55536/api/calculator/specialAdd?a=5&b=7&strAdd=true');
    t.is(res2.status, 200);
    t.deepEqual(await res2.json(), { error: null, result: { value: 57 } });
});