const getApiBase = () => "/api";

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

async function fetchApi<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const base = getApiBase().replace(/\/$/, "");
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(data.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return null as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  health: () => fetchApi("/health"),

  login: (email: string, password: string) =>
    fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    fetchApi<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  me: (token: string) => fetchApi<ApiUser>("/auth/me", { token }),

  users: {
    list: (token: string) => fetchApi<ApiUser[]>("/users", { token }),

    create: (token: string, name: string, email: string, password: string, role: string) =>
      fetchApi<ApiUser>("/users", {
        method: "POST",
        token,
        body: JSON.stringify({ name, email, password, role }),
      }),

    update: (token: string, id: number, data: { name?: string; role?: string; is_active?: boolean }) =>
      fetchApi<ApiUser>(`/users/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(data),
      }),

    delete: (token: string, id: number) =>
      fetchApi<null>(`/users/${id}`, { method: "DELETE", token }),
  },
};
