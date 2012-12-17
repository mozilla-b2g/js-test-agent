RUNNER_DIR=$(PWD)/test-agent
TEST_DIR=$(PWD)/test/test-agent/
TEST_CONFIG=$(RUNNER_DIR)/config.json
DEV_FILE=./test-agent.js
REPORTER=Dot
SHELL=/bin/bash

package :
	rm -f $(DEV_FILE)
	touch $(DEV_FILE)

	cat ./lib/test-agent/inspect.js >> $(DEV_FILE)
	cat ./lib/test-agent/export-error.js >> $(DEV_FILE)
	cat ./lib/test-agent/responder.js >> $(DEV_FILE)
	cat ./lib/test-agent/loader.js >> $(DEV_FILE)
	cat ./lib/test-agent/sandbox.js >> $(DEV_FILE)
	cat ./lib/test-agent/config.js >> $(DEV_FILE)
	cat ./lib/test-agent/websocket-client.js >> $(DEV_FILE)
	cat ./lib/test-agent/mocha/reporter-base.js >> $(DEV_FILE)
	cat ./lib/test-agent/mocha/json-stream-reporter.js >> $(DEV_FILE)
	cat ./lib/test-agent/mocha/runner-stream-proxy.js >> $(DEV_FILE)
	cat ./lib/test-agent/mocha/concurrent-reporting-events.js >> $(DEV_FILE)
	cat ./lib/test-agent/mocha/reporter.js >> $(DEV_FILE)
	cat ./lib/test-agent/common/mocha-test-events.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/websocket.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/post-message.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/multi-domain-driver.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/mocha-driver.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/error-reporting.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/config.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/test-ui.js >> $(DEV_FILE)

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

