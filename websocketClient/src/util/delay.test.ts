import test from 'ava'
import {delay} from "./delay";

test('Resolves after given delay', async t => {
    const testTimeout = 50;

    const startTime = Date.now();
    await delay(50);
    const endTime = Date.now();

    const timeTaken = endTime - startTime;
    const tolerance = 15;

    t.true(timeTaken > (testTimeout - tolerance));
    t.true(timeTaken < (testTimeout + tolerance));
});
