const errorHandeler = async(err, req, res, next)=>{
    return res
    .status(err.statusCode || 500)
    .json({
        statusCode : err.statusCode || 500,
        message: err.message,
        stack: err.stack,
        success : false
    });
}

export default errorHandeler