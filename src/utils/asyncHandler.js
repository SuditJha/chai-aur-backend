// Promises wrapper
// Define a utility function called asyncHandler
const asyncHandler = (requestHandler) => {
    // Define a new function that takes req, res, and next as parameters
    return (req, res, next) => {
        // Wrap the invocation of requestHandler in a Promise.resolve() to ensure it always returns a promise
        Promise.resolve(requestHandler(req, res, next))
            // Catch any errors that occur during the asynchronous operation
            .catch((error) => next(error));
    };
};

// Export the asyncHandler function for use in other modules
export { asyncHandler };

