#!/usr/bin/env bash

#exit on error
set -e

./testAll.sh

#submit reports to coveralls
./server/node_modules/nyc/bin/nyc.js report --reporter=text-lcov | ./server/node_modules/coveralls/bin/coveralls.js
