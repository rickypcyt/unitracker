import { toast } from 'react-toastify';

/**
 * Custom middleware for handling errors in Redux actions
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retries for failed actions
 * @param {number} options.retryDelay - Delay between retries in milliseconds
 * @returns {Function} Redux middleware
 */
export const createErrorMiddleware = (options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  return () => (next) => async (action) => {
    // If the action doesn't have a payload or it's not a promise, just pass it through
    if (!action.payload || typeof action.payload.then !== 'function') {
      return next(action);
    }

    let retries = 0;
    let lastError = null;

    while (retries <= maxRetries) {
      try {
        const result = await action.payload;
        return next({ ...action, payload: result });
      } catch (error) {
        lastError = error;
        retries++;

        // If we've reached max retries, dispatch the error action
        if (retries > maxRetries) {
          const errorAction = {
            type: `${action.type}_ERROR`,
            payload: error.message,
            meta: {
              originalAction: action,
              retries,
              error
            }
          };

          // Show error toast
          toast.error(error.message || 'An error occurred');

          return next(errorAction);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * retries));
      }
    }

    // This should never be reached, but just in case
    return next({
      type: `${action.type}_ERROR`,
      payload: lastError.message,
      meta: {
        originalAction: action,
        retries,
        error: lastError
      }
    });
  };
}; 