import test from 'ava'
import {API, APIEndpoint} from "../../server";
import {APIClient} from "../../websocketClient";
import {delay} from "./util/delay";
import {AccessDeniedError} from "../../server/src/errorTypes";

test.serial('Passes access key to endpoint', async t => {
    //Server
    class TestEndpoint extends APIEndpoint {
        connect() {
            t.is(this.accessKey, 'myAccessKey');
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    await testAPI.listen(8052);

    //Client
    const apiClient = new APIClient('http://localhost:8052/');
    await apiClient.connect();

    await apiClient.connectToEndpoint('test', 'myAccessKey');

    await delay(50);
    testAPI.server.close();
});

test.serial('Gives error if endpoint returns access denied on connect', async t => {
    //Server
    class TestEndpoint extends APIEndpoint {
        connect() {
            throw new AccessDeniedError('Test access denied');
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    await testAPI.listen(8052);

    //Client
    const apiClient = new APIClient('http://localhost:8052/');
    await apiClient.connect();

    try {
        await apiClient.connectToEndpoint('test', 'myAccessKey');
        t.fail();
    } catch(e) {
        t.is(e.message, 'Access denied: Test access denied');
        t.pass();
    }

    await delay(50);
    testAPI.server.close();
});

test.serial('Gives error if endpoint returns access denied on action', async t => {
    //Server
    class TestEndpoint extends APIEndpoint {
        $test() {
            throw new AccessDeniedError('Test access denied');
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    await testAPI.listen(8052);

    //Client
    const apiClient = new APIClient('http://localhost:8052/');
    await apiClient.connect();

    const ep = await apiClient.connectToEndpoint('test', 'myAccessKey');

    try {
        await ep.callAction('test');
        t.fail();
    } catch(e) {
        t.is(e.message, 'Access denied: Test access denied');
        t.pass();
    }

    await delay(50);
    testAPI.server.close();
});

test.serial('Passes connection level access key if available', async t => {
    //Server
    class TestEndpoint extends APIEndpoint {
        connect() {
            t.is(this.accessKey, 'myAccessKey');
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    await testAPI.listen(8052);

    //Client
    const apiClient = new APIClient('http://localhost:8052/');
    apiClient.accessKey = 'myAccessKey';

    await apiClient.connect();

    await apiClient.connectToEndpoint('test');

    await delay(50);
    testAPI.server.close();
});
