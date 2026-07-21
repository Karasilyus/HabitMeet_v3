// HabitMeet backend API istemcisi.
// API adresi .env içinde VITE_API_URL ile ayarlanır (varsayılan: http://localhost:3000).

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000";

export type User = {
  id: number;
  name: string;
  email: string;
  role: "user" | "moderator" | "admin";
  neighborhood: string;
  created_at?: string;
};

export type Habit = {
  id: number;
  name: string;
  type_id: number | null;
  type_name: string | null;
  streak: number;
  loggedToday: boolean;
};

export type HabitLog = { date: string; completed: number };

export type ActivityType = { id: number; name: string; is_approved: number };

export type Match = {
  id: number;
  status: "pending" | "accepted" | "rejected";
  requested_by: number;
  type_id: number;
  type_name: string;
  other_user_id: number;
  other_user_name: string;
  other_neighborhood: string;
  unread_count: number;
};

export type ChatMessage = {
  id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  created_at: string;
};

export type Conversation = {
  match: { id: number; user_id1: number; user_id2: number; type_id: number };
  messages: ChatMessage[];
};

export type ForumPost = {
  id: number;
  user_id: number;
  author_name: string;
  type_name: string | null;
  title: string;
  body: string;
  created_at: string;
  comment_count: number;
};

export type ForumComment = {
  id: number;
  user_id: number;
  author_name: string;
  body: string;
  created_at: string;
};

export type Stats = {
  totalHabits: number;
  bestCurrentStreak: number;
  totalCompletedLogs: number;
  acceptedMatches: number;
};

export type SleepLog = { id: number; date: string; hours: number };
export type BlockedUser = { blocked_id: number; blocked_name: string };

const TOKEN_KEY = "habitmeet_token";
const USER_KEY = "habitmeet_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: User) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

// SQLite "YYYY-MM-DD HH:MM:SS" (UTC) veya ISO string'i güvenle Date'e çevirir.
export function parseDbDate(s: string): Date {
  if (!s) return new Date();
  return new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let data: unknown = {};
  try {
    data = await res.json();
  } catch {
    // boş gövde
  }

  if (res.status === 401 && token && typeof window !== "undefined") {
    clearSession();
    window.location.href = "/login";
  }
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : "Bir hata oluştu.";
    throw new Error(msg);
  }
  return data as T;
}
