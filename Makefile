RUNNER_DIR=$(PWD)/test-agent
TEST_DIR=$(PWD)/test/test-agent/
TEST_CONFIG=$(RUNNER_DIR)/config.json
DEV_FILE=./test-agent.js

package :
	# Bundle /w mocha for now
	cat ./vendor/mocha/mocha.js >> $(DEV_FILE)
	cat ./lib/test-agent/responder.js >> $(DEV_FILE)
	cat ./lib/test-agent/loader.js >> $(DEV_FILE)
	cat ./lib/test-agent/sandbox.js >> $(DEV_FILE)
	cat ./lib/test-agent/config.js >> $(DEV_FILE)
	cat ./lib/test-agent/websocket-client.js >> $(DEV_FILE)
	cat ./lib/test-agent/mocha/json-stream-reporter.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/mocha-driver.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/config.js >> $(DEV_FILE)
	cat ./lib/test-agent/browser-worker/test-ui.js >> $(DEV_FILE)


	rm -Rf ./vendor/mocha
	mkdir -p ./vendor/mocha
	cp node_modules/mocha/mocha.js ./vendor/mocha/
	cp node_modules/mocha/mocha.css ./vendor/mocha/
	cp node_modules/expect.js/expect.js ./vendor/
	cp $(DEV_FILE) ./vendor/test-agent.js
	# Compat
	cp $(DEV_FILE) ./vendor/test-agent-dev.js


	rm -f $(DEV_FILE)
	touch $(DEV_FILE)

test_config:
	sh ./tools/create-config.sh $(TEST_CONFIG) $(TEST_DIR) \*-test.js /test/test-agent

test_server:
	./bin/js-test-agent server --growl

test :
	@./node_modules/mocha/bin/mocha \
		test/helper.js test/node/mocha/*.js \
		test/node/*-test.js  \
		test/test-agent/responder-test.js \
		test/test-agent/websocket-client-test.js

	@# Watch File Conflicts require this to run in a seperate process...
	@./node_modules/mocha/bin/mocha test/helper.js test/node/server/*-test.js


.PHONY: test_config
.PHONY: test_server
.PHONY: package
.PHONY: httpd
.PHONY: test

