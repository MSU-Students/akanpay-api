export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export type ApiError = {
  status: number;
  message: string;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const message = await safeMessage(res);
    throw { status: res.status, message } satisfies ApiError;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

async function safeMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(', ') : body.message;
    }
  } catch {
    // ignore
  }

  return res.statusText || 'Request failed';
}
