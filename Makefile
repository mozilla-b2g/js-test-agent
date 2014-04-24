RUNNER_DIR=$(PWD)/test-agent
TEST_DIR=$(PWD)/test/test-agent/
TEST_CONFIG=$(RUNNER_DIR)/config.json
DEV_FILE=./test-agent.js
REPORTER=Dot
SHELL=/bin/bash

DEV_FILES=./lib/test-agent/inspect.js \
	./lib/test-agent/export-error.js \
	./lib/test-agent/responder.js \
	./lib/test-agent/loader.js \
	./lib/test-agent/sandbox.js \
	./lib/test-agent/config.js \
	./lib/test-agent/websocket-client.js \
	./lib/test-agent/mocha/reporter-base.js \
	./lib/test-agent/mocha/json-stream-reporter.js \
	./lib/test-agent/mocha/runner-stream-proxy.js \
	./lib/test-agent/mocha/concurrent-reporting-events.js \
	./lib/test-agent/mocha/reporter.js \
	./lib/test-agent/common/mocha-test-events.js \
	./lib/test-agent/browser-worker.js \
	./lib/test-agent/browser-worker/websocket.js \
	./lib/test-agent/browser-worker/post-message.js \
	./lib/test-agent/browser-worker/multi-domain-driver.js \
	./lib/test-agent/browser-worker/mocha-driver.js \
	./lib/test-agent/browser-worker/blanket-driver.js \
	./lib/test-agent/browser-worker/error-reporting.js \
	./lib/test-agent/browser-worker/config.js \
	./lib/test-agent/browser-worker/test-ui.js \
	./lib/test-agent/blanket/blanket-report-collector.js


package :
	rm -f $(DEV_FILE)
	touch $(DEV_FILE)
	echo "/* This is a built file do not modify directly */" >> $(DEV_FILE)
	echo >> $(DEV_FILE)
	cat $(DEV_FILES) >> $(DEV_FILE)

test-config:
	sh ./tools/create-config.sh $(TEST_CONFIG) $(TEST_DIR) \*-test.js /test/test-agent

test-server:
	./bin/js-test-agent server --growl

test : test-browser test-node

.PHONY: ci
ci: package
	./tools/ci.sh

test-browser:
	./bin/js-test-agent test --reporter $(REPORTER)

test-node :
	@./node_modules/mocha/bin/mocha \
		test/helper.js \
		test/node/*-test.js  \
		test/test-agent/mocha/*-test.js  \
		test/test-agent/common/*-test.js  \
		test/test-agent/responder-test.js \
		test/test-agent/websocket-client-test.js

	@# Watch File Conflicts require this to run in a seperate process...
	@./node_modules/mocha/bin/mocha test/helper.js test/node/server/*-test.js


.PHONY: test-config
.PHONY: test-server
.PHONY: package
.PHONY: httpd
.PHONY: test

