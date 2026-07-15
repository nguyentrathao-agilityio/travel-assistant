import { z } from 'zod';

import { AppError, APP_ERROR_CODE } from './app-error';

export const apiFetch = async <S extends z.ZodTypeAny>(
  url: string,
  schema: S,
  params?: Record<string, string>
): Promise<z.output<S>> => {
  const fullUrl = params ? `${url}?${new URLSearchParams(params)}` : url;

  let res: Response;
  try {
    res = await fetch(fullUrl);
  } catch (cause) {
    throw new AppError(APP_ERROR_CODE.NETWORK, `Network request failed: ${fullUrl}`, cause);
  }

  if (!res.ok) {
    throw new AppError(APP_ERROR_CODE.API, `API error ${res.status} ${res.statusText}: ${fullUrl}`);
  }

  const raw = await res.json();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      APP_ERROR_CODE.PARSE,
      `Invalid response from ${fullUrl}: ${parsed.error.message}`
    );
  }

  return parsed.data;
};

export const apiFetchOrNull = async <S extends z.ZodTypeAny>(
  url: string,
  schema: S,
  params?: Record<string, string>
): Promise<z.output<S> | null> => {
  try {
    return await apiFetch(url, schema, params);
  } catch {
    return null;
  }
};
