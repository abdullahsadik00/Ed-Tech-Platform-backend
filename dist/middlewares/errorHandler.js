"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const CustomError_1 = require("../utils/CustomError");
const errorHandler = (err, req, res, next) => {
    console.error(err);
    if (err instanceof CustomError_1.CustomError) {
        res.status(err.statusCode).json({
            hasError: true,
            message: err.message,
            errors: err.errors,
        });
        return;
    }
    res.status(500).json({
        hasError: true,
        message: 'Internal Server Error',
        errors: [],
    });
};
exports.errorHandler = errorHandler;
