# 0.2.0
  - TestAgent.Responder now has .once (per event emitter spec)

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
