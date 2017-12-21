import test from 'ava'
import {API, APIEndpoint} from "../../server";
import {APIClient} from "../../websocketClient";
import {delay} from "./util/delay";

test.serial('Throws timeout error if connect() takes too long', async t => {
    //Server
    class TestEndpoint extends APIEndpoint {
        async connect() {
            await delay(200);
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    await testAPI.listen(8052);

    //Client
    const apiClient = new APIClient('http://localhost:8052/');
    apiClient.timeout = 100;
    await apiClient.connect();

    try {
        await apiClient.connectToEndpoint('test');
        t.fail();
    } catch(e) {
        t.is(e.message, 'connectToEndpoint(\'test\') timed out');
        t.pass();
    }

    testAPI.server.close();
});

test.serial('Throws timeout error if callAction() takes too long', async t => {
    //Server
    class TestEndpoint extends APIEndpoint {
        async $test() {
            await delay(200);
            return {};
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    await testAPI.listen(8052);

    //Client
    const apiClient = new APIClient('http://localhost:8052/');
    await apiClient.connect();

    const testEP = await apiClient.connectToEndpoint('test');
    testEP.timeout = 100;

    try {
        await testEP.callAction('test');
        t.fail();
    } catch(e) {
        t.is(e.message, 'callAction(\'test\', {}) timed out');
        t.pass();
    }

    testAPI.server.close();
});