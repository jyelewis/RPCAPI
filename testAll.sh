#!/usr/bin/env bash

#exit on error
set -e

cd server
yarn
npm test -- --verbose
cd ..

cd websocketClient
yarn
npm test -- --verbose
cd ..

#e2e tests
cd e2eTests
yarn
npm test -- --verbose
cd ..