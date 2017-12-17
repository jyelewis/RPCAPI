import test from 'ava'

import { createGuid } from './guid'

test('generates a 32 character string', t => {
    t.is(createGuid().length, 32);
});

test('generates different strings each time', t => {
    for (let i = 0; i < 1000; i++) {
        t.not(createGuid(), createGuid());
    }
});