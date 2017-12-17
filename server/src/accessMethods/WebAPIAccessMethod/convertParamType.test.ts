import test from 'ava'
import {convertParamType} from "./convertParamType";
import {paramType} from "../../APIEndpoint";

test('Converts to string', async t => {
    const convertedVal = convertParamType(paramType.string, 'testVar', 'hello');
    t.is(convertedVal, 'hello');
});

test('Converts to number', async t => {
    const convertedVal = convertParamType(paramType.number, 'testVar', '123');
    t.is(convertedVal, 123);
});

test('Converts to boolean (str lit)', async t => {
    const convertedValTrue = convertParamType(paramType.boolean, 'testVar', 'true');
    t.is(convertedValTrue, true);

    const convertedValFalse = convertParamType(paramType.boolean, 'testVar', 'false');
    t.is(convertedValFalse, false);
});

test('Converts to boolean (int val)', async t => {
    const convertedValTrue = convertParamType(paramType.boolean, 'testVar', '1');
    t.is(convertedValTrue, true);

    const convertedValFalse = convertParamType(paramType.boolean, 'testVar', '0');
    t.is(convertedValFalse, false);
});

test('Converts to array', async t => {
    const convertedVal = convertParamType(paramType.array, 'testVar', '[1, 2, "a"]');
    t.deepEqual(convertedVal, [1, 2, 'a']);
});

test('Converts to object', async t => {
    const convertedVal = convertParamType(paramType.object, 'testVar', '{ "a": 1, "b": 2 }');
    t.deepEqual(convertedVal, { "a": 1, "b": 2 });
});

test('Throws with invalid number', async t => {
    t.throws(
        () => convertParamType(paramType.number, 'testVar', 'a')
    );
});

test('Throws with invalid bool type', async t => {
    t.throws(
        () => convertParamType(paramType.boolean, 'testVar', 'hi')
    );
});

test('Throws with invalid object', async t => {
    t.throws(
        () => convertParamType(paramType.object, 'testVar', '{')
    );
});

test('Throws with invalid array', async t => {
    t.throws(
        () => convertParamType(paramType.array, 'testVar', 'asfd')
    );

    t.throws(
        () => convertParamType(paramType.array, 'testVar', '{}')
    );
});

test('Throws with empty parameter', async t => {
    t.throws(
        () => convertParamType(paramType.string, 'testVar', undefined)
    );
});