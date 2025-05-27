class MyError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.message = message || "Something went wrong";
        this.data = null;
        this.success = false;
    }
}

export default MyError;
