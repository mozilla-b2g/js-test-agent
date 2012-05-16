# 0.4.0
  - Ported all node/mocha/ scripts to test-agent/mocha/ they will now
    run in both the browser and server

  - Adding support for running tests across different domains via
    iframes. This will eventually lead to multi worker support between
    browsers.

# 0.3.1
  - Add missing WebsocketClient.close method

# 0.3.0
  - Cleaner firefox stacktraces
  - New option to change type of required scripts.

# 0.2.0
  - TestAgent.Responder now has .once (per event emitter spec)
  - Fixed XUnit reporter support
  - Added event mirroring support you can now send a message 
    to the server and all events of those types will be forwarded or
    mirrored to your client websocket.
  - Added base node/client as a building block for new commands
  - improved test-agent test. It now offers an option of reporters and
    will show reports in stdout with correct exit status on
    error/success.

# 0.1.2
  - calling require on cached script url will now
    correctly fire after (or if) the script has been loaded.

# 0.1.1

- Syntax errors that occur during the run will now also cause
  a test error.

# 0.1.0
- Added much better remote console.log by using node's console.log code.
- Added syntax error handling to sandbox with ui, growl and reporter
  notifications.
