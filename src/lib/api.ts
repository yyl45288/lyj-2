import type {
  Room,
  Reservation,
  StudyRecord,
  User,
  PointLog,
  LeaderboardItem,
  LeaderboardPeriod,
} from "@/../../shared/types";

const baseURL = `${window.location.origin}/api`;
const TOKEN_KEY = "auth_token";

type ApiResponse<T> = { data: T; message?: string };

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${baseURL}${path}`;
  const token = getToken();

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    removeToken();
  }

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    throw new Error(err.message || `HTTP error! status: ${response.status}`);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}

export const api = {
  login: (payload: {
    username: string;
    password: string;
  }): Promise<{ user: User; token: string }> =>
    request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  register: (payload: {
    username: string;
    password: string;
  }): Promise<{ user: User; token: string }> =>
    request<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: (): Promise<{ success: boolean }> =>
    request<{ success: boolean }>("/auth/logout", {
      method: "POST",
    }),

  fetchCurrentUser: (): Promise<User> => request<User>("/auth/me"),

  fetchRooms: (): Promise<Room[]> => request<Room[]>("/rooms"),

  fetchRoom: (id: string): Promise<Room> => request<Room>(`/rooms/${id}`),

  reserveSeat: (payload: {
    roomId: string;
    seatId: string;
    startTime: string;
    endTime: string;
  }): Promise<Reservation> =>
    request<Reservation>("/seats/reserve", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  cancelReservation: (reservationId: string): Promise<void> =>
    request<void>("/seats/cancel", {
      method: "POST",
      body: JSON.stringify({ reservationId }),
    }),

  checkIn: (payload: {
    roomId: string;
    seatId: string;
  }): Promise<{ recordId: string; checkInTime: string }> =>
    request<{ recordId: string; checkInTime: string }>("/study/checkin", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  checkOut: async (
    recordId: string
  ): Promise<{ durationMinutes: number; pointsEarned: number }> => {
    const data = await request<{ durationMinutes: number; points: number }>(
      "/study/checkout",
      {
        method: "POST",
        body: JSON.stringify({ recordId }),
      }
    );
    return {
      durationMinutes: data.durationMinutes,
      pointsEarned: data.points,
    };
  },

  pauseStudy: (recordId: string): Promise<void> =>
    request<void>("/study/pause", {
      method: "POST",
      body: JSON.stringify({ recordId }),
    }),

  resumeStudy: (recordId: string): Promise<void> =>
    request<void>("/study/resume", {
      method: "POST",
      body: JSON.stringify({ recordId }),
    }),

  fetchStudyRecords: (userId: string): Promise<StudyRecord[]> =>
    request<StudyRecord[]>(`/study/records?userId=${encodeURIComponent(userId)}`),

  fetchUserInfo: (): Promise<User> => request<User>("/user/info"),

  fetchPoints: (userId: string): Promise<PointLog[]> =>
    request<PointLog[]>(`/user/points?userId=${encodeURIComponent(userId)}`),

  fetchReservations: (userId: string): Promise<Reservation[]> =>
    request<Reservation[]>(
      `/user/reservations?userId=${encodeURIComponent(userId)}`
    ),

  fetchLeaderboard: (
    period: LeaderboardPeriod
  ): Promise<LeaderboardItem[]> =>
    request<LeaderboardItem[]>(`/leaderboard?period=${period}`),

  getToken,
  setToken,
  removeToken,
};

export default api;
