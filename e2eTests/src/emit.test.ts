import test from 'ava'
import {API, APIEndpoint} from "../../server";
import {APIClient} from "../../websocketClient";
import {delay} from "./util/delay";

test.serial('Receives emitted event from server', async t => {
    //Server
    class TestEndpoint extends APIEndpoint {
        connect() {
            setTimeout(() => {
                this.emit('testEvent');
            }, 50);
        }
    }

    const testAPI = new API();
    testAPI.registerEndpoint('test', TestEndpoint);
    await testAPI.listen(8052);

    //Client
    const apiClient = new APIClient('http://localhost:8052/');
    apiClient.timeout = 100;
    await apiClient.connect();

    const testEP = await apiClient.connectToEndpoint('test');

    testEP.on('testEvent', () => {
        t.pass();
        testAPI.server.close();
    });

    await delay(100);
});
