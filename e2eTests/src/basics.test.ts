import test from 'ava'
import {API, APIEndpoint} from "../../server";
import {APIClient} from "../../websocketClient";
import {delay} from "./util/delay";

test.serial('Connect and call action', async t => {
    t.plan(3);

    //Server
    class TestEndpoint extends APIEndpoint {
        connect() {
            t.pass();
        }

        disconnect() {
            t.pass();
        }

        $sayHello() {
            t.pass();
            return {};
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    await testAPI.listen(8052);

    //Client
    const apiClient = new APIClient('http://localhost:8052/');
    await apiClient.connect();

    const testEndpoint = await apiClient.connectToEndpoint('test');
    await testEndpoint.callAction('sayHello');
    testEndpoint.disconnect();

    await delay(50);
    testAPI.server.close();
});

test.serial('Pass arguments to action', async t => {
    //Server
    class TestEndpoint extends APIEndpoint {
        $sayHelloParams = { a: 'string' };
        $sayHello({ a }: { a: 'string' }) {
            t.is(a, 'hello world');
            return {};
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    await testAPI.listen(8052);

    //Client
    const apiClient = new APIClient('http://localhost:8052/');
    await apiClient.connect();

    const testEndpoint = await apiClient.connectToEndpoint('test');
    await testEndpoint.callAction('sayHello', { a: 'hello world' });

    testAPI.server.close();
});

test.serial('Returns actions return object', async t => {
    //Server
    class TestEndpoint extends APIEndpoint {
        $sayHello() {
            return { value: 123 };
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    await testAPI.listen(8052);

    //Client
    const apiClient = new APIClient('http://localhost:8052/');
    await apiClient.connect();

    const testEndpoint = await apiClient.connectToEndpoint('test');
    const val = await testEndpoint.callAction('sayHello');
    t.deepEqual(val, { value: 123 });

    testAPI.server.close();
});

test.serial('Doesnt pass unspecified params', async t => {
    //Server
    class TestEndpoint extends APIEndpoint {
        $sayHelloParams = { a: 'string' };
        $sayHello({ a, b }: { a: 'string', b: number }) {
            t.is(a, 'hello world');
            t.is(typeof b, 'undefined');

            return {};
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    await testAPI.listen(8052);

    //Client
    const apiClient = new APIClient('http://localhost:8052/');
    await apiClient.connect();

    const testEndpoint = await apiClient.connectToEndpoint('test');
    await testEndpoint.callAction('sayHello', { a: 'hello world', b: 123 });

    testAPI.server.close();
});