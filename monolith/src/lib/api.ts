/**
 * Centralized API client for communicating with the FastAPI backend.
 * All fetch calls use VITE_BASE_URL from the .env file.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/** Error thrown when the backend is unreachable */
export class BackendOfflineError extends Error {
  constructor() {
    super(
      'Backend not running. Start with:\n  uvicorn project.main:app --reload'
    );
    this.name = 'BackendOfflineError';
  }
}

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Wraps fetch to handle 401s by automatically calling /refresh and queuing failed requests */
export async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const makeRequest = () => {
    const headers = {
      ...options.headers,
      ...getAuthHeaders(),
    };
    return fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Crucial for sending/receiving HTTP-only cookies
    });
  };

  try {
    const response = await makeRequest();

    if (response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshRes = await fetch(`${BASE_URL}/refresh`, {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem('access_token', data.access_token);
            
            // Resolve the queue
            refreshQueue.forEach((cb) => cb());
            refreshQueue = [];
            isRefreshing = false;
            
            // Retry the original request
            return makeRequest();
          } else {
            // Refresh failed - session expired
            localStorage.removeItem('access_token');
            window.location.href = '/login';
            throw new Error('Session expired');
          }
        } catch (error) {
          isRefreshing = false;
          throw error;
        }
      }

      // If already refreshing, wait for it to finish and then retry
      return new Promise((resolve) => {
        refreshQueue.push(() => {
          resolve(makeRequest());
        });
      });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || "Server error");
    }

    return response;
  } catch (err: any) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new BackendOfflineError();
    }
    throw err;
  }
}


export async function registerUser(data: any) {
  const res = await safeFetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginUser(data: any) {
  const res = await safeFetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

/** GET / — quick health check */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    await safeFetch(`${BASE_URL}/`);
    return true;
  } catch {
    return false;
  }
}

/**
 * POST /upload — upload a CSV file to store embeddings in Pinecone.
 * Returns `{ message: string }`.
 */
export async function uploadFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await safeFetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: form,
  });
  return res.json() as Promise<{ message: string }>;
}

/**
 * POST /analyze — upload a CSV file to get Gemini AI analysis.
 * Now returns detailed intelligent insights.
 */
export async function analyzeFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await safeFetch(`${BASE_URL}/analyze`, {
    method: 'POST', 
    body: form,
  });
  return res.json() as Promise<any>;
}

/**
 * POST /ask?question=... — ask the AI assistant a question.
 * Returns `{ context: string, answer: string }`.
 */
export async function askQuestion(question: string) {
  const res = await safeFetch(
    `${BASE_URL}/ask?question=${encodeURIComponent(question)}`,
    { method: 'POST' }
  );
  return res.json() as Promise<{ context: string; answer: string }>;
}

export async function getHistory() {
  const res = await safeFetch(`${BASE_URL}/history`, { method: 'GET' });
  return res.json() as Promise<any[]>;
}
