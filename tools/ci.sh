#!/bin/bash

Xvfb :99 &
XVFB_PROCESS=$!

make test-server &
SERVER_PROCESS=$!

npm install -g mozilla-download
mozilla-download --product firefox firefox

DISPLAY=:99 ./firefox/firefox http://localhost:8789/test-agent/ 2>/dev/null &
FIREFOX_PROCESS=$!

echo "Running tests..."
echo "  - Firefox $FIREFOX_PROCESS";
echo "  - Xvfb $XVFB_PROCESS";
echo "  - Server $SERVER_PROCESS";
echo

make test

RESULT_STATUS=$?

kill $FIREFOX_PROCESS;
kill $SERVER_PROCESS;
kill $XVFB_PROCESS;

exit $RESULT_STATUS;
