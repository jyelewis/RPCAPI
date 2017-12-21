#!/usr/bin/env bash

#exit on error
set -e

#install deps
cd server
yarn
./node_modules/typescript/bin/tsc
cd ..

cd websocketClient
yarn
./node_modules/typescript/bin/tsc
cd ..

cd e2eTests
yarn
./node_modules/typescript/bin/tsc
cd ..

#run all tests (with coverage)
./server/node_modules/nyc/bin/nyc.js ./server/node_modules/ava/cli.js --verbose \
    $(find ./server/src -type f \( -name "*.test.js" -o -name "*.itest.js" \)) \
    $(find ./websocketClient/src -type f \( -name "*.test.js" -o -name "*.itest.js" \))

#e2e tests
cd e2eTests
npm test -- --verbose
cd ..