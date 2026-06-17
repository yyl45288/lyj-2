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

type ApiResponse<T> = { data: T; message?: string };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${baseURL}${path}`;
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(err.message || `HTTP error! status: ${response.status}`);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}

export const api = {
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
};

export default api;
