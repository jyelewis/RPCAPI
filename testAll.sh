#!/usr/bin/env bash

#exit on error
set -e

#install deps
cd server
yarn
cd ..

cd websocketClient
yarn
cd ..

cd e2eTests
yarn
cd ..

#run all tests (with coverage)
./server/node_modules/nyc/bin/nyc.js ./server/node_modules/ava/cli.js --verbose ./server/**/src/**/*.test.js ./server/**/src/**/*.itest.js ./websocketClient/**/src/**/*.test.js ./websocketClient/**/src/**/*.itest.js

#e2e tests
cd e2eTests
npm test -- --verbose
cd ..