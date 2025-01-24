import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { CustomError } from '../utils/CustomError';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err);

  if (err instanceof CustomError) {
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
