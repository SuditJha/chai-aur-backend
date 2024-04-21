// Define a utility function called asyncHandler
const asyncHandler = (fn) => {
    // Define a new asynchronous function that takes req, res, and next as parameters
    return async (req, res, next) => {
        try {
            // Await the execution of the provided asynchronous function (fn)
            await fn(req, res, next);
        } catch (error) {
            // If an error occurs during the execution of fn, handle it
            res.status(error.code || 500).json({
                success: false,
                message: error.message
            })
        }
    }
}

// Export the asyncHandler function for use in other modules
export { asyncHandler };
