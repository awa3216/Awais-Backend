class ApiError extends Error {
    constructor(message, status) {
        super(); // it calls extends class constructor
        this.status = status;
        this.message = message;
    }
    // In ApiError class
    static conflict(message = 'Conflict!') {
        return new ApiError(message, 409);
    }

    static wrongCredentials(message = 'Username or Password is wrong!') {
        return new ApiError(message, 401);
    }

    static unAuthorized(message = 'unAuthorized Access') {
        return new ApiError(message, 401);
    }
}

export default ApiError;
