const errorHandler = (err, req, res, next) => {
    const response = {
        statusCode: err.status || 500,
        success: false,
        message: err.message || "Internal Server Error",
    };
    return res.status(response.statusCode).json(response);
};

export default errorHandler;
