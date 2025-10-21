const SuccessHandler = (data, statusCode, message, res) => {
    const response = {
        statusCode,
        message,
        success: true,
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

export default SuccessHandler;
