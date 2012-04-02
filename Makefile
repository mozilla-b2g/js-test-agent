httpd :
	node ./tools/httpd.js $(PWD) 8888


package :
	rm -Rf ./vendor/mocha
	mkdir -p ./vendor/mocha
	cp node_modules/mocha/mocha.js ./vendor/mocha/
	cp node_modules/mocha/mocha.css ./vendor/mocha/
	cp node_modules/expect.js/expect.js ./vendor/

test :
	# Soon...

.PHONY: package
.PHONY: httpd
.PHONY: test
