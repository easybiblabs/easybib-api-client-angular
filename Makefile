# some commands need sudo on linux, but not on macs, or travis
# (see .travis.yml)
export MAYBE_SUDO=sudo
ifeq ($(shell uname -s),Darwin)
	export MAYBE_SUDO=
endif

ci:
	gulp lint
	karma start --single-run

install:
	npm install
	which gulp || $(MAYBE_SUDO) npm install -g gulp@3.8.6
	which karma || $(MAYBE_SUDO) npm install -g karma-cli@0.0.4
	which mocha || $(MAYBE_SUDO) npm install -g mocha@1.20.1

release:
	gulp release
