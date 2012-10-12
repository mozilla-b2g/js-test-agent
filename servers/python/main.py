import pprint
import json
import sys

from twisted.internet import reactor
from autobahn.websocket import WebSocketServerFactory, \
                               WebSocketServerProtocol, \
                               listenWS

class TestAgentServer(WebSocketServerProtocol):

    def emit(self, event, data):
        command = (event, data);
        raw = json.dumps(command)
        print raw
        self.sendMessage(raw);

    def onOpen(self):
        tests = sys.argv[1:len(sys.argv)];
        self.sendTestRun(tests);

    def sendTestRun(self, tests):
        self.emit('run tests', { 'tests': tests });

    def onMessage(self, data, binary):
        print data;

if __name__ == '__main__':
    factory = WebSocketServerFactory("ws://localhost:8789")
    factory.protocol = TestAgentServer
    listenWS(factory)
    reactor.run()

