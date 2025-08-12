// ResizeObserver loop error fix
// This suppresses the common "ResizeObserver loop completed with undelivered notifications" error

export const suppressResizeObserverError = () => {
  // Store the original error handler
  const originalErrorHandler = window.onerror;
  
  window.onerror = function(message, source, lineno, colno, error) {
    // Check if the error is a ResizeObserver loop error
    if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
      console.warn('ResizeObserver loop error suppressed:', message);
      return true; // Prevent the error from being logged
    }
    
    // Call the original error handler for other errors
    if (originalErrorHandler) {
      return originalErrorHandler.call(this, message, source, lineno, colno, error);
    }
    
    return false;
  };

  // Also handle unhandled promise rejections
  const originalRejectionHandler = window.onunhandledrejection;
  
  window.onunhandledrejection = function(event) {
    if (event.reason && event.reason.message && 
        event.reason.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      console.warn('ResizeObserver loop error suppressed in promise:', event.reason.message);
      event.preventDefault();
      return;
    }
    
    if (originalRejectionHandler) {
      return originalRejectionHandler.call(this, event);
    }
  };
};

// Utility function to safely use ResizeObserver with cleanup
export const createSafeResizeObserver = (callback) => {
  let resizeObserver;
  
  try {
    resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to prevent loop errors
      window.requestAnimationFrame(() => {
        if (entries.length > 0) {
          callback(entries);
        }
      });
    });
  } catch (error) {
    console.warn('ResizeObserver not supported:', error);
    return null;
  }
  
  return resizeObserver;
};
