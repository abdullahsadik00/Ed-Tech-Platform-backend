"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        hasError: true,
        message: 'Resourse not found',
        errors: [],
    });
};
exports.notFoundHandler = notFoundHandler;
