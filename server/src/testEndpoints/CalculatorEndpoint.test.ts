import test from 'ava'
import {CalculatorEndpoint} from './CalculatorEndpoint'
import {delay} from "../util/delay";

test('Add basic numbers', async t => {
    const calc = new CalculatorEndpoint();
    await calc.callConnect();
    const value = await calc.callAction('add', { a: 1, b: 2 });
    t.deepEqual(value, { value: 3 });
});

test('Throws adding larger numbers (ActionError)', async t => {
    const calc = new CalculatorEndpoint();
    await calc.callConnect();

    try {
        await calc.callAction('add',{ a: 1000, b: 87652 });
        t.fail();
    } catch(e) {
        t.is(e.message, 'Add cannot perform operations greater than 10000');
        t.pass();
    }
});

test('Special adds using numbers', async t => {
    const calc = new CalculatorEndpoint();
    await calc.callConnect();
    const value = await calc.callAction('specialAdd',{ a: 5, b: 7, strAdd: false });
    t.deepEqual(value, { value: 12 });
});

test('Special adds using strings', async t => {
    const calc = new CalculatorEndpoint();
    await calc.callConnect();
    const value = await calc.callAction('specialAdd',{ a: 5, b: 7, strAdd: true });
    t.deepEqual(value, { value: 57 });
});

test('Subtracts', async t => {
    const calc = new CalculatorEndpoint();
    await calc.callConnect();
    const value = await calc.callAction('subtract',{ a: 10, b: 3 });
    t.deepEqual(value, { value: 7 });
});

test('Multiplies', async t => {
    const calc = new CalculatorEndpoint();
    await calc.callConnect();

    const value = await calc.callAction('multiply',{ a: 10, b: 3 });
    t.deepEqual(value, { value: 30 });

    const value2 = await calc.callAction('multiply',{ a: 35, b: 4 });
    t.deepEqual(value2, { value: 140 });
});

test('Slow adds', async t => {
    const calc = new CalculatorEndpoint();
    await calc.callConnect();

    const value = await calc.callAction('slowAdd',{ a: 1, b: 2 });
    t.deepEqual(value, { value: 3 });
});

test('Slow adds many items in parallel', async t => {
    const calc = new CalculatorEndpoint();
    await calc.callConnect();

    const testCases = [
        { a: 1, b: 2, res: 3 },
        { a: 3, b: 6, res: 9 },
        { a: 3, b: 1, res: 4 },
        { a: -1, b: 10, res: 9 },
        { a: 0, b: -5, res: -5 },
        { a: 100, b: 23, res: 123 },
    ];

    await Promise.all(
        testCases.map(async c => {
            const res = await calc.$slowAdd({ a: c.a, b: c.b });
            t.deepEqual(res, { value: c.res });
        })
    );
});

test('Watches adds', async t => {
    const calc = new CalculatorEndpoint();
    await calc.callConnect();

    calc.registerEmitHandler((eventName: string, args: any[]) => {
        t.is(eventName, 'addCalculationPerformed');
        t.is(args[0], 3);
        t.pass();
    });

    const value = await calc.callAction('watchAdds');
    t.deepEqual(value, { done: true });

    await calc.callAction('add',{ a: 1, b: 2 });

    await delay(10);
});

test('Fails to watch adds if the connection doenst allow emitting', async t => {
    const calc = new CalculatorEndpoint();
    await calc.callConnect();

    try {
        await calc.callAction('watchAdds');
        t.fail();
    } catch(e) {
        t.is(e.message, 'Cannot watch adds from and endpoint that cannot receive events');
        t.pass();
    }
});
