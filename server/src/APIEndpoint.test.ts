import test from 'ava'

import {APIEndpoint, paramType} from './APIEndpoint'
import {delay} from "./util/delay";

test('actionExists()', async t => {
    class TestEndpoint extends APIEndpoint {
        $add() {}

        $subtract() {}
    }

    const ep = new TestEndpoint();

    t.true(ep.actionExists('add'));
    t.true(ep.actionExists('subtract'));

    t.false(ep.actionExists('$add'));
    t.false(ep.actionExists('$subtract'));
    t.false(ep.actionExists('multiply'));
});

test('actionParams()', async t => {
    class TestEndpoint extends APIEndpoint {
        $addParams = { a: paramType.number };
        $add(a: number) {}

        $subtract() {}
    }

    const ep = new TestEndpoint();

    t.deepEqual(ep.actionParams('add'), { a: paramType.number });
    t.deepEqual(ep.actionParams('subtract'), { });

    t.throws(() => ep.actionParams('multiply'));
});

test('callAction() sync', async t => {
    t.plan(2);

    class TestEndpoint extends APIEndpoint {
        $add({a}: { a:number }) {
            t.is(a, 123);
            return {
                num: 456
            };
        }

        $subtract() {}
    }

    const ep = new TestEndpoint();
    await ep.callConnect();

    const val = await ep.callAction('add', { a: 123 });
    t.deepEqual(val, {
        num: 456
    });
});

test('callAction() async', async t => {
    t.plan(2);

    class TestEndpoint extends APIEndpoint {
        async $add({a}: { a:number }) {
            t.is(a, 123);
            return new Promise(resolve => {
                setTimeout(() => resolve({ num: 456 }), 100);
            });
        }

        $subtract() {}
    }

    const ep = new TestEndpoint();
    await ep.callConnect();

    const val = await ep.callAction('add', { a: 123 });
    t.deepEqual(val, {
        num: 456
    });
});

test('callAction() calls with correct "this" context', async t => {
    t.plan(1);

    class TestEndpoint extends APIEndpoint {
        testVar = 'local var!';

        $add() {
            t.is(this.testVar, 'local var!');
            return { done: true };
        }

        $subtract() {}
    }

    const ep = new TestEndpoint();
    await ep.callConnect();

    await ep.callAction('add');
});

test('callAction() throws if an action doesnt exist', async t => {
    class TestEndpoint extends APIEndpoint {
        $add({a}: { a:number }) {
            return 123;
        }

        $subtract() {}
    }

    const ep = new TestEndpoint();

    try {
        await ep.callAction('multiply', { a: 123, b: 2 })
        t.fail('callAction did not throw');
    } catch(e) {
        t.pass();
    }
});

test('callAction() throws if an action doesnt return an object', async t => {
    class TestEndpoint extends APIEndpoint {
        $add({a}: { a:number }) {
            return 123;
        }

        $subtract() {}
    }

    const ep = new TestEndpoint();

    try {
        await ep.callAction('add', { a: 123 })
        t.fail('callAction did not throw');
    } catch(e) {
        t.pass();
    }
});

test('canEmit() correctly tells if an emitHandler has been registered', async t => {
    const ep = new APIEndpoint();

    //We cant emit, there is no handler registered
    t.false(ep.canEmit());

    ep.registerEmitHandler((eventName: string, args: any[]) => {});

    t.true(ep.canEmit());
});

test('Emit handler is called when emitting', async t => {
    const ep = new APIEndpoint();
    await ep.callConnect();

    //We cant emit, there is no handler registered
    t.false(ep.canEmit());

    ep.registerEmitHandler((eventName: string, args: any[]) => {
        t.is(eventName, 'testEventName');
        t.deepEqual(args, ['arg1', 2, 'arg3']);
    });

    ep.emit('testEventName', 'arg1', 2, 'arg3');
});

test('Throws if .emit is called with no handler registered', async t => {
    const ep = new APIEndpoint();
    await ep.callConnect();

    //We cant emit, there is no handler registered
    t.false(ep.canEmit());

    t.throws(
        () => ep.emit('testEventName', 'arg1', 2, 'arg3')
    );
});

test('Throws if .emit is called before connect', async t => {
    const ep = new APIEndpoint();
    ep.registerEmitHandler(() => {});

    t.true(ep.canEmit());

    //Still should throw because we have not called connect yet
    t.throws(
        () => ep.emit('testEventName', 'arg1', 2, 'arg3')
    );
});

test('Throws if .emit is called after disconnect', async t => {
    const ep = new APIEndpoint();
    ep.registerEmitHandler(() => {});

    t.true(ep.canEmit());

    await ep.callConnect();

    t.notThrows(
        () => ep.emit('testEventName', 'arg1', 2, 'arg3')
    );

    await ep.callDisconnect();

    t.throws(
        () => ep.emit('testEventName', 'arg1', 2, 'arg3')
    );
});

test('callConnect and callDisconnect do not fail if the endpoint does not have functions for these hooks', async t => {
    class TestEndpoint extends APIEndpoint {}

    const ep = new TestEndpoint();

    await ep.callConnect();
    await ep.callDisconnect();

    t.pass();
});

test('callConnect() calls connect and returns once connect() resolves', async t => {
    let assert1 = false;
    let assert2 = false;

    class TestEndpoint extends APIEndpoint {
        async connect() {
            assert1 = true;
            await delay(10);
            assert2 = true;
        }
    }

    const ep = new TestEndpoint();

    t.false(assert1);
    t.false(assert2);
    await ep.callConnect();
    t.true(assert1);
    t.true(assert2);
});

test('callDisconnect() calls disconnect and returns once disconnect() resolves', async t => {
    let assert1 = false;
    let assert2 = false;

    class TestEndpoint extends APIEndpoint {
        async disconnect() {
            assert1 = true;
            await delay(10);
            assert2 = true;
        }
    }

    const ep = new TestEndpoint();

    await ep.callConnect();

    t.false(assert1);
    t.false(assert2);
    await ep.callDisconnect();
    t.true(assert1);
    t.true(assert2);
});

test('Throws if trying to callConnect() while already connected', async t => {
    class TestEndpoint extends APIEndpoint {}

    const ep = new TestEndpoint();

    await ep.callConnect();

    try {
        await ep.callConnect();
        t.fail();
    } catch(e) {
        t.pass();
    }
});

test('Throws if trying to callDisconnect() while not connected', async t => {
    class TestEndpoint extends APIEndpoint {}

    const ep = new TestEndpoint();

    await ep.callConnect();

    await ep.callDisconnect();

    try {
        await ep.callDisconnect();
        t.fail();
    } catch(e) {
        t.pass();
    }
});