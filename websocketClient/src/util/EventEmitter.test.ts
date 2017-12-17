import test from 'ava'
import { EventEmitter } from "./EventEmitter";

test('Emits and receives event', async t => {
    return new Promise((resolve) => {
        const ee = new EventEmitter();
        ee.on('testEvent1', () => {
            ee.emit('testEvent2');
        });

        ee.on('testEvent2', () => {
            t.pass();
            resolve();
        });

        ee.emit('testEvent1');
    });
});

test('Passes arguments', async t => {
    return new Promise((resolve) => {
        const ee = new EventEmitter();
        ee.on('testEvent1', (a: number, b: string) => {
            t.is(a, 123);
            t.is(b, 'hello');
            resolve();
        });

        ee.emit('testEvent1', 123, 'hello');
    });
});

test('Calls multiple listeners', async t => {
    return new Promise((resolve) => {
        const ee = new EventEmitter();

        let test1 = false;
        let test2 = false;

        function checkAllExecuted() {
            if (test1 && test2) {
                t.pass();
                resolve();
            }
        }

        ee.on('testEvent1', (a: number, b: string) => {
            test1 = true;
            checkAllExecuted();
        });

        ee.on('testEvent1', (a: number, b: string) => {
            test2 = true;
            checkAllExecuted();
        });

        ee.emit('testEvent1');
    });
});

test('Removing listener stops it being called', t => {
    return new Promise((resolve) => {
        const ee = new EventEmitter();

        let called1 = false;

        const handler = () => {
            if (called1) {
                t.fail('Handler was called after .off()');
                return;
            }
            called1 = true;
        };

        ee.on('testEvent1', handler);
        ee.emit('testEvent1');

        ee.off('testEvent1', handler);
        ee.emit('testEvent1'); //Should not trigger the handler

        setTimeout(() => {
            t.true(called1);
            resolve();
        }, 10);
    });
});

test('Num listeners', t => {
    const ee = new EventEmitter();

    t.is(ee.numListeners('asdf'), 0);

    const noop1 = () => {};
    const noop2 = () => {};

    ee.on('asdf', noop1);
    t.is(ee.numListeners('asdf'), 1);

    ee.on('asdf', noop2);
    t.is(ee.numListeners('asdf'), 2);

    ee.off('asdf', noop1);
    t.is(ee.numListeners('asdf'), 1);

    ee.off('asdf', noop2);
    t.is(ee.numListeners('asdf'), 0);
});