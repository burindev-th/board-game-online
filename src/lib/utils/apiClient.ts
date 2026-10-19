/**
 * API Client
 * เรียก API route ภายในแอปแบบส่ง/รับ JSON
 */

type JsonMethod = 'POST' | 'PATCH';

/**
 * ส่ง request (แนบ body เป็น JSON ถ้ามี) แล้วคืน Response
 */
export function requestJson(url: string, body?: unknown, method: JsonMethod = 'POST'): Promise<Response> {
  if (body === undefined) {
    return fetch(url, { method });
  }

  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * ส่ง request แล้ว parse response เป็น JSON
 */
export async function fetchJson<T>(url: string, body?: unknown, method: JsonMethod = 'POST'): Promise<{ response: Response; data: T }> {
  const response = await requestJson(url, body, method);
  const data: T = await response.json();
  return { response, data };
}
