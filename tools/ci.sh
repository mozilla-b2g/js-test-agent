#!/bin/bash

Xvfb :99 &
XVFB_PROCESS=$!

make test-server &
SERVER_PROCESS=$!

DISPLAY=:99 firefox http://localhost:8789/test-agent/ &
FIREFOX_PROCESS=$!

sleep 3
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
