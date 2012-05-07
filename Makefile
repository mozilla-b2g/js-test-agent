RUNNER_DIR=$(PWD)/test-agent
TEST_DIR=$(PWD)/test/test-agent/
TEST_CONFIG=$(RUNNER_DIR)/config.json
DEV_FILE=./test-agent.js
REPORTER=Spec

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
	cat ./lib/test-agent/browser-worker.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/websocket.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/post-message.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/multi-domain-driver.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/mocha-driver.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/error-reporting.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/config.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/test-ui.js >> $(DEV_FILE)


	rm -Rf ./vendor/mocha
	mkdir -p ./vendor/mocha
	cp node_modules/mocha/mocha.js ./vendor/mocha/
	cp node_modules/mocha/mocha.css ./vendor/mocha/
	cp node_modules/expect.js/expect.js ./vendor/

test-config:
	sh ./tools/create-config.sh $(TEST_CONFIG) $(TEST_DIR) \*-test.js /test/test-agent

test-server:
	./bin/js-test-agent server --growl

test : test-browser test-node

test-browser:
	./bin/js-test-agent test --reporter $(REPORTER)

test-node :
	@./node_modules/mocha/bin/mocha --reporter $(REPORTER) \
		test/helper.js test/node/mocha/*.js \
		test/node/*-test.js  \
		test/test-agent/responder-test.js \
		test/test-agent/websocket-client-test.js

	@# Watch File Conflicts require this to run in a seperate process...
	@./node_modules/mocha/bin/mocha test/helper.js test/node/server/*-test.js


.PHONY: test-config
.PHONY: test-server
.PHONY: package
.PHONY: httpd
.PHONY: test

