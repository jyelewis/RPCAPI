import test from 'ava'

import {APIEndpoint, paramType} from './APIEndpoint'

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

    //We cant emit, there is no handler registered
    t.false(ep.canEmit());

    t.throws(
        () => ep.emit('testEventName', 'arg1', 2, 'arg3')
    );
});