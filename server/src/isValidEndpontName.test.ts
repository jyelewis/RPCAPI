import test from 'ava'
import {isValidEndpointName} from "./isValidEndpointName";

test('Validates endpoint names', t => {
    //Valid names
    t.true(isValidEndpointName('test'));
    t.true(isValidEndpointName('Test'));
    t.true(isValidEndpointName('test-1'));
    t.true(isValidEndpointName('Test123'));
    t.true(isValidEndpointName('test.users.test'));
    t.true(isValidEndpointName('test-users-test'));
    t.true(isValidEndpointName('test-users.12a3.-test'));
    t.true(isValidEndpointName('HELLOWORLD.-_'));
    t.true(isValidEndpointName('__test__'));

    //Invalid names
    t.false(isValidEndpointName('test users'));
    t.false(isValidEndpointName('test   users'));
    t.false(isValidEndpointName('test/users'));
    t.false(isValidEndpointName('test=users'));
    t.false(isValidEndpointName('Hellø'));
    t.false(isValidEndpointName('Tommy&Krista'));
    t.false(isValidEndpointName('valid&'));
    t.false(isValidEndpointName('&valid'));
});
