import test from 'ava'
import {validateParamType} from "./validateParamType";
import {paramType} from "../../APIEndpoint";

test('Validates a string', async t => {
    t.notThrows(
        () => validateParamType(paramType.string, 'testVar', '123')
    );
});

test('Throws on invalid string', async t => {
    t.throws(
        () => validateParamType(paramType.string, 'testVar', 123)
    );
});

test('Validates a number', async t => {
    t.notThrows(
        () => validateParamType(paramType.number, 'testVar', 123)
    );
});

test('Throws on invalid number', async t => {
    t.throws(
        () => validateParamType(paramType.number, 'testVar', '123')
    );
});

test('Validates a boolean', async t => {
    t.notThrows(
        () => validateParamType(paramType.boolean, 'testVar', true)
    );

    t.notThrows(
        () => validateParamType(paramType.boolean, 'testVar', false)
    );
});

test('Throws on invalid boolean', async t => {
    t.throws(
        () => validateParamType(paramType.boolean, 'testVar', 1)
    );
});

test('Validates an array', async t => {
    t.notThrows(
        () => validateParamType(paramType.array, 'testVar', [1, 2, 3])
    );
});

test('Throws on invalid array', async t => {
    t.throws(
        () => validateParamType(paramType.array, 'testVar', '123')
    );
});

test('Validates an object', async t => {
    t.notThrows(
        () => validateParamType(paramType.object, 'testVar', { a: 1 })
    );
});

test('Throws on invalid object', async t => {
    t.throws(
        () => validateParamType(paramType.array, 'testVar', 123)
    );
});

test('Throws on invalid type', async t => {
   t.throws(
       () => validateParamType(<any>'asdf', 'testVar', 123)
   );
});

test('Throws with missing parameter', async t => {
    t.throws(
        () => validateParamType(paramType.string, 'testVar', undefined)
    );
});