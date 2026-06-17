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
import useToastStore from "./useToastStore";

interface AppState {
  isAuthenticated: boolean;
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
    auth: boolean;
  };
  login: (username: string, password: string) => Promise<User>;
  register: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
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
}

const DEFAULT_USER_ID = "user_self";

const initialLoading = {
  userInfo: false,
  rooms: false,
  currentRoom: false,
  leaderboard: false,
  myReservations: false,
  studyRecords: false,
  auth: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
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

  login: async (username: string, password: string) => {
    set({ loading: { ...get().loading, auth: true } });
    try {
      const result = await api.login({ username, password });
      api.setToken(result.token);
      set({
        isAuthenticated: true,
        userInfo: result.user,
        loading: { ...get().loading, auth: false },
      });
      useToastStore.getState().showSuccess("登录成功", `欢迎回来，${result.user.username}！`);
      return result.user;
    } catch (err) {
      set({ loading: { ...get().loading, auth: false } });
      useToastStore.getState().showError(err);
      throw err;
    }
  },

  register: async (username: string, password: string) => {
    set({ loading: { ...get().loading, auth: true } });
    try {
      const result = await api.register({ username, password });
      api.setToken(result.token);
      set({
        isAuthenticated: true,
        userInfo: result.user,
        loading: { ...get().loading, auth: false },
      });
      useToastStore.getState().showSuccess("注册成功", "欢迎加入学习平台！");
      return result.user;
    } catch (err) {
      set({ loading: { ...get().loading, auth: false } });
      useToastStore.getState().showError(err);
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    api.removeToken();
    set({
      isAuthenticated: false,
      userInfo: null,
      myReservations: [],
      studyRecords: [],
      currentSession: null,
    });
    useToastStore.getState().showSuccess("已安全登出");
  },

  checkAuth: async () => {
    const token = api.getToken();
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    set({ loading: { ...get().loading, auth: true } });
    try {
      const user = await api.fetchCurrentUser();
      set({
        isAuthenticated: true,
        userInfo: user,
        loading: { ...get().loading, auth: false },
      });
    } catch {
      api.removeToken();
      set({
        isAuthenticated: false,
        userInfo: null,
        loading: { ...get().loading, auth: false },
      });
    }
  },

  loadUser: async () => {
    set({ loading: { ...get().loading, userInfo: true } });
    try {
      const user = await api.fetchUserInfo();
      set({ userInfo: user, loading: { ...get().loading, userInfo: false } });
    } catch (err) {
      set({ loading: { ...get().loading, userInfo: false } });
      useToastStore.getState().showError(err);
    }
  },

  loadRooms: async () => {
    set({ loading: { ...get().loading, rooms: true } });
    try {
      const rooms = await api.fetchRooms();
      set({ rooms, loading: { ...get().loading, rooms: false } });
    } catch (err) {
      set({ loading: { ...get().loading, rooms: false } });
      useToastStore.getState().showError(err);
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
      set({ loading: { ...get().loading, currentRoom: false } });
      useToastStore.getState().showError(err);
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
      set({ loading: { ...get().loading, leaderboard: false } });
      useToastStore.getState().showError(err);
    }
  },

  loadMyReservations: async (userId: string = DEFAULT_USER_ID) => {
    set({ loading: { ...get().loading, myReservations: true } });
    try {
      const targetUserId = get().isAuthenticated ? (get().userInfo?.id ?? userId) : userId;
      const reservations = await api.fetchReservations(targetUserId);
      set({ myReservations: reservations, loading: { ...get().loading, myReservations: false } });
    } catch (err) {
      set({ loading: { ...get().loading, myReservations: false } });
      useToastStore.getState().showError(err);
    }
  },

  loadStudyRecords: async (userId: string = DEFAULT_USER_ID) => {
    set({ loading: { ...get().loading, studyRecords: true } });
    try {
      const targetUserId = get().isAuthenticated ? (get().userInfo?.id ?? userId) : userId;
      const records = await api.fetchStudyRecords(targetUserId);
      set({ studyRecords: records, loading: { ...get().loading, studyRecords: false } });
    } catch (err) {
      set({ loading: { ...get().loading, studyRecords: false } });
      useToastStore.getState().showError(err);
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
      useToastStore.getState().showSuccess("已暂停学习");
    } catch (err) {
      useToastStore.getState().showError(err);
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
      useToastStore.getState().showSuccess("已恢复学习", "继续加油！");
    } catch (err) {
      useToastStore.getState().showError(err);
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
      useToastStore.getState().showSuccess("预约成功", "请按时到达自习室哦～");
      return reservation;
    } catch (err) {
      useToastStore.getState().showError(err);
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
      useToastStore.getState().showSuccess("取消成功", "预约已取消");
    } catch (err) {
      useToastStore.getState().showError(err);
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
      useToastStore.getState().showSuccess("签到成功", "开始高效学习吧！");
      return result;
    } catch (err) {
      useToastStore.getState().showError(err);
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
      useToastStore.getState().showSuccess(
        "签退成功",
        `学习了 ${result.durationMinutes} 分钟，获得 ${result.pointsEarned} 积分！`
      );
      return result;
    } catch (err) {
      useToastStore.getState().showError(err);
      throw err;
    }
  },
}));

export default useAppStore;
