import { isAxiosError } from 'axios';

export interface ApiError {
  status: number;
  code?: string;
  message: string;
  requiredAAL?: number;
}

export function parseApiError(error: unknown): ApiError {
  if (isAxiosError(error) && error.response) {
    const data = error.response.data;
    return {
      status: error.response.status,
      code: data?.error?.code,
      message: data?.error?.message ?? data?.message ?? error.message,
      requiredAAL: data?.error?.requiredAAL,
    };
  }
  return { status: 500, message: error instanceof Error ? error.message : 'Unknown error' };
}

export function isNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

export function isForbidden(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 403;
}

export function isInsufficientAAL(error: unknown): boolean {
  return isAxiosError(error) && error.response?.data?.error?.code === 'INSUFFICIENT_AAL';
}

