

function errorHandler(err, req, res, next) {
    // Handle the error here
    console.error(err);
    console.log('theres been an error')
  
    // Determine the status code based on the error
    const statusCode = err.statusCode || 500;
    
    // Respond with an error JSON response
    res.status(statusCode).json({
      error: {
        message: err.message || 'Internal Server Error',
      },
    });
    next();
  }
  
module.exports = errorHandler;