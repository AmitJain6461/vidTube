const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => {
      next(error);
    });
  };
};

export { asyncHandler };

// READ : The asyncHandler function allows you to write route handlers in a synchronous style,
// without worrying about explicitly handling Promise rejections.
// It wraps the asynchronous requestHandler function passed to it
// and ensures that any errors thrown or rejected Promises are passed to Express's next function for centralized error handling.
