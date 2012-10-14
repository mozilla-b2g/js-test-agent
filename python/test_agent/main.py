import pprint
import json
import sys

import reporters
from twisted.internet import reactor
from autobahn.websocket import WebSocketServerFactory, \
                               WebSocketServerProtocol, \
                               listenWS

class TestAgentServer(WebSocketServerProtocol):

    def __init__(self):
        self.increment = 0;
        self.envs = {};
        self.pending_envs = [];

    def emit(self, event, data):
        command = (event, data);
        self.sendMessage(json.dumps(command));

    def onEnvsComplete(self):
        names = [];

        for env in self.envs:
            print self.envs[env].output
            print 'env: (' + env + ')'
            print '\n'.join(self.envs[env].output)


    def handleEvent(self, event, data):
        if event == 'test data':
            # the 'test data' event is a nested event
            # inside of the main event body. It is a direct
            # copy of the mocha reporter data with the addition
            # of the 'testAgentEnvId' which is used to group
            # the results of different test runs.
            (testEvent, testData) = json.loads(data[0]);

            # gaia & test agent both use environment ids because
            # they nest test runners. This is a very special case
            # most test agent runners will not do this so add a
            # fallback environment name to make this simpler.
            if ('testAgentEnvId' in testData):
                testEnv = testData['testAgentEnvId'];
            else:
                testEnv = 'global';

            # add to pending
            if (testEvent == 'start'):
                self.pending_envs.append(testEnv);
                self.envs[testEnv] = reporters.Spec(stream = False);

            # don't process out of order commands
            if not (testEnv in self.envs):
                return;

            self.envs[testEnv].handle_event(testEvent, testData);

            # remove from pending and trigger test complete check.
            if (testEvent == 'end'):
                idx = self.pending_envs.index(testEnv);
                del self.pending_envs[idx];

                # now that envs are totally complete show results.
                if (len(self.pending_envs) == 0):
                    self.onEnvsComplete();


    def onOpen(self):
        self.increment = self.increment + 1;
        tests = sys.argv[1:len(sys.argv)];
        self.sendTestRun(tests);

    def sendTestRun(self, tests):
        def format(value):
            if (value[0] != '/'):
                value = '/' + value
            return value

        tests = map(format, tests)
        self.emit('run tests', { 'tests': tests });

    def onMessage(self, data, binary):
        command = json.loads(data)
        # test agent protocol always uses the [event, data] format.
        self.handleEvent(command[0], [command[1]])


if __name__ == '__main__':
    factory = WebSocketServerFactory("ws://localhost:8789")
    factory.protocol = TestAgentServer
    listenWS(factory)
    reactor.run()

