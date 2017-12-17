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
