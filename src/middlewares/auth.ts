import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/CustomError';
import prisma from '../config/prisma';

interface JWTPayload {
  userId: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      req.cookies?.token ||
      req.body?.token ||
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader);

    if (!token) {
      throw new CustomError(401, 'No token provided');
    }

    const decode = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decode.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new CustomError(401, 'User not found');
    }
    req.user = user;
    next();
  } catch (error) {
    next(new CustomError(401, 'Invalid token'));
  }
};

// Like authenticate, but never rejects: sets req.user when a valid token is
// present and otherwise continues anonymously. For public routes whose response
// depends on who is asking (e.g. drafts visible only to their instructor).
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  try {
    const decode = jwt.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET as string
    ) as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: decode.userId },
      select: { id: true, role: true },
    });
    if (user) req.user = user;
  } catch {
    // Invalid or expired token: treat the request as anonymous.
  }
  next();
};

export const requireRole = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new CustomError(403, 'Insufficient permissions'));
    }
    next();
  };
