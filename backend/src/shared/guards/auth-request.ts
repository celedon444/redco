import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id?: string;
    sub?: string;
    email?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
  };
}
