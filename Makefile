RUNNER_DIR=$(PWD)/runner
TEST_DIR=$(PWD)/test/
TEST_CONFIG=$(RUNNER_DIR)/config.json

httpd :
	node ./tools/httpd.js $(PWD) 8888


package :
	rm -Rf ./vendor/mocha
	mkdir -p ./vendor/mocha
	cp node_modules/mocha/mocha.js ./vendor/mocha/
	cp node_modules/mocha/mocha.css ./vendor/mocha/
	cp node_modules/expect.js/expect.js ./vendor/

test_config:
	sh ./tools/create-config.sh $(TEST_CONFIG) $(TEST_DIR) \*-test.js /test

test :
	./node_modules/mocha/bin/mocha test/helper.js test/node/mocha/*.js test/node/*.js test/test-agent/responder-test.js


.PHONY: test_config
.PHONY: package
.PHONY: httpd
.PHONY: test
