(function() {
  if (typeof window === 'undefined') return;

  function isExtensionError(err) {
    if (!err) return false;
    var str = '';
    try {
      if (typeof err === 'string') {
        str = err;
      } else if (err && typeof err === 'object') {
        str = (err.stack || '') + ' ' + (err.message || '') + ' ' + (err.name || '');
      }
    } catch(e) {
      str = String(err);
    }
    return (
      str.indexOf('extension://') !== -1 ||
      str.indexOf('nimlmejbmnecnaghgmbahmbaddhjbecg') !== -1 ||
      str.indexOf('M_ID') !== -1 ||
      str.indexOf('executors/200.js') !== -1
    );
  }

  // Intercept window error event at capture phase
  window.addEventListener('error', function(event) {
    if (
      isExtensionError(event.error) ||
      isExtensionError(event.message) ||
      isExtensionError(event.filename)
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return true;
    }
  }, true);

  // Intercept unhandledrejection event at capture phase
  window.addEventListener('unhandledrejection', function(event) {
    if (isExtensionError(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return true;
    }
  }, true);

  // Intercept console.error
  var rawConsoleError = console.error;
  console.error = function() {
    for (var i = 0; i < arguments.length; i++) {
      if (isExtensionError(arguments[i])) {
        return;
      }
    }
    rawConsoleError.apply(console, arguments);
  };

  // Intercept console.warn
  var rawConsoleWarn = console.warn;
  console.warn = function() {
    for (var j = 0; j < arguments.length; j++) {
      if (isExtensionError(arguments[j])) {
        return;
      }
    }
    rawConsoleWarn.apply(console, arguments);
  };
})();
