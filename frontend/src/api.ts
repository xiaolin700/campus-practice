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

export interface PageData<T> {
  records: T[];
  total: number;
  page: number;
  size: number;
}

async function fetchApi<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const base = getApiBase().replace(/\/$/, "");
  const url = `${base}${path}`;
  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.message || body?.detail || `HTTP ${res.status}`;
    if (res.status === 401) {
      localStorage.removeItem("user-mgmt-auth");
      if (!window.location.hash.includes("login")) {
        window.location.reload();
      }
    }
    throw new Error(detail);
  }

  if (res.status === 204) {
    return null as T;
  }

  // Unwrap unified response: {code, message, data, timestamp} → data
  const body = await res.json();
  if (body && typeof body === "object" && "code" in body && "data" in body) {
    return body.data as T;
  }
  return body as T;
}

export const api = {
  health: () =>
    fetchApi<{ status: string; version: string }>("/health"),

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
    list: (
      token: string,
      params?: { page?: number; size?: number; keyword?: string; role?: string },
    ) => {
      const search = new URLSearchParams();
      if (params?.page) search.set("page", String(params.page));
      if (params?.size) search.set("size", String(params.size));
      if (params?.keyword) search.set("keyword", params.keyword);
      if (params?.role) search.set("role", params.role);
      const qs = search.toString();
      return fetchApi<PageData<ApiUser>>(`/users${qs ? `?${qs}` : ""}`, { token });
    },

    create: (
      token: string,
      name: string,
      email: string,
      password: string,
      role: string,
    ) =>
      fetchApi<ApiUser>("/users", {
        method: "POST",
        token,
        body: JSON.stringify({ name, email, password, role }),
      }),

    update: (
      token: string,
      id: number,
      data: { name?: string; role?: string; is_active?: boolean },
    ) =>
      fetchApi<ApiUser>(`/users/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(data),
      }),

    delete: (token: string, id: number) =>
      fetchApi<null>(`/users/${id}`, { method: "DELETE", token }),
  },
};
