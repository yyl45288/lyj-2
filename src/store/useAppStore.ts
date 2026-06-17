import { create } from "zustand";
import type {
  User,
  Room,
  Reservation,
  StudyRecord,
  LeaderboardItem,
  LeaderboardPeriod,
  StudySession,
} from "@/../../shared/types";
import api from "@/lib/api";

interface AppState {
  userInfo: User | null;
  rooms: Room[];
  currentRoom: Room | null;
  leaderboard: Record<LeaderboardPeriod, LeaderboardItem[]>;
  currentSession: StudySession | null;
  myReservations: Reservation[];
  studyRecords: StudyRecord[];
  loading: {
    userInfo: boolean;
    rooms: boolean;
    currentRoom: boolean;
    leaderboard: boolean;
    myReservations: boolean;
    studyRecords: boolean;
  };
  error: string | null;
  loadUser: () => Promise<void>;
  loadRooms: () => Promise<void>;
  loadRoom: (id: string) => Promise<void>;
  loadLeaderboard: (period: LeaderboardPeriod) => Promise<void>;
  loadMyReservations: (userId?: string) => Promise<void>;
  loadStudyRecords: (userId?: string) => Promise<void>;
  setCurrentSession: (session: StudySession | null) => void;
  pauseCurrentSession: () => Promise<void>;
  resumeCurrentSession: () => Promise<void>;
  doReserve: (
    roomId: string,
    seatId: string,
    startTime: string,
    endTime: string
  ) => Promise<Reservation>;
  doCancelReservation: (reservationId: string) => Promise<void>;
  doCheckIn: (
    roomId: string,
    seatId: string
  ) => Promise<{ recordId: string; checkInTime: string }>;
  doCheckOut: () => Promise<{
    durationMinutes: number;
    pointsEarned: number;
  }>;
  clearError: () => void;
}

const DEFAULT_USER_ID = "user_self";

const initialLoading = {
  userInfo: false,
  rooms: false,
  currentRoom: false,
  leaderboard: false,
  myReservations: false,
  studyRecords: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  userInfo: null,
  rooms: [],
  currentRoom: null,
  leaderboard: {
    daily: [],
    weekly: [],
    monthly: [],
  },
  currentSession: null,
  myReservations: [],
  studyRecords: [],
  loading: initialLoading,
  error: null,

  loadUser: async () => {
    set({ loading: { ...get().loading, userInfo: true } });
    try {
      const user = await api.fetchUserInfo();
      set({ userInfo: user, loading: { ...get().loading, userInfo: false } });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "加载用户信息失败",
        loading: { ...get().loading, userInfo: false },
      });
    }
  },

  loadRooms: async () => {
    set({ loading: { ...get().loading, rooms: true } });
    try {
      const rooms = await api.fetchRooms();
      set({ rooms, loading: { ...get().loading, rooms: false } });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "加载房间列表失败",
        loading: { ...get().loading, rooms: false },
      });
    }
  },

  loadRoom: async (id: string) => {
    set({ loading: { ...get().loading, currentRoom: true } });
    try {
      const room = await api.fetchRoom(id);
      set((state) => ({
        currentRoom: room,
        rooms: state.rooms.map((r) => (r.id === id ? room : r)),
        loading: { ...state.loading, currentRoom: false },
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "加载房间详情失败",
        loading: { ...get().loading, currentRoom: false },
      });
    }
  },

  loadLeaderboard: async (period: LeaderboardPeriod) => {
    set({ loading: { ...get().loading, leaderboard: true } });
    try {
      const items = await api.fetchLeaderboard(period);
      set((state) => ({
        leaderboard: { ...state.leaderboard, [period]: items },
        loading: { ...state.loading, leaderboard: false },
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "加载排行榜失败",
        loading: { ...get().loading, leaderboard: false },
      });
    }
  },

  loadMyReservations: async (userId: string = DEFAULT_USER_ID) => {
    set({ loading: { ...get().loading, myReservations: true } });
    try {
      const reservations = await api.fetchReservations(userId);
      set({ myReservations: reservations, loading: { ...get().loading, myReservations: false } });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "加载预约记录失败",
        loading: { ...get().loading, myReservations: false },
      });
    }
  },

  loadStudyRecords: async (userId: string = DEFAULT_USER_ID) => {
    set({ loading: { ...get().loading, studyRecords: true } });
    try {
      const records = await api.fetchStudyRecords(userId);
      set({ studyRecords: records, loading: { ...get().loading, studyRecords: false } });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "加载学习记录失败",
        loading: { ...get().loading, studyRecords: false },
      });
    }
  },

  setCurrentSession: (session: StudySession | null) => {
    set({ currentSession: session });
  },

  pauseCurrentSession: async () => {
    const { currentSession } = get();
    if (!currentSession) return;
    try {
      await api.pauseStudy(currentSession.recordId);
      set({
        currentSession: { ...currentSession, isPaused: true },
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "暂停失败" });
    }
  },

  resumeCurrentSession: async () => {
    const { currentSession } = get();
    if (!currentSession) return;
    try {
      await api.resumeStudy(currentSession.recordId);
      set({
        currentSession: { ...currentSession, isPaused: false },
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "恢复失败" });
    }
  },

  doReserve: async (
    roomId: string,
    seatId: string,
    startTime: string,
    endTime: string
  ) => {
    try {
      const reservation = await api.reserveSeat({
        roomId,
        seatId,
        startTime,
        endTime,
      });
      set((state) => ({
        myReservations: [...state.myReservations, reservation],
      }));
      return reservation;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "预约失败" });
      throw err;
    }
  },

  doCancelReservation: async (reservationId: string) => {
    try {
      await api.cancelReservation(reservationId);
      set((state) => ({
        myReservations: state.myReservations.filter(
          (r) => r.id !== reservationId
        ),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "取消预约失败" });
      throw err;
    }
  },

  doCheckIn: async (roomId: string, seatId: string) => {
    try {
      const result = await api.checkIn({ roomId, seatId });
      set({
        currentSession: {
          recordId: result.recordId,
          roomId,
          seatId,
          checkInTime: result.checkInTime,
          isPaused: false,
          accumulatedSeconds: 0,
        },
      });
      return result;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "签到失败" });
      throw err;
    }
  },

  doCheckOut: async () => {
    const { currentSession } = get();
    if (!currentSession) {
      throw new Error("当前没有进行中的学习会话");
    }
    try {
      const result = await api.checkOut(currentSession.recordId);
      set({ currentSession: null });
      return result;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "签退失败" });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAppStore;
