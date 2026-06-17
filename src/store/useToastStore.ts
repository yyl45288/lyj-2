import { create } from "zustand";
import type { ToastMessage } from "../types/error";
import { ApiError, isApiError } from "../lib/error";

interface ToastState {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
  showError: (error: unknown) => void;
  showSuccess: (title: string, message?: string) => void;
}

let toastIdCounter = 0;

function generateToastId(): string {
  return `toast_${Date.now()}_${toastIdCounter++}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: (toast) => {
    const id = generateToastId();
    const duration = toast.duration ?? (toast.type === "error" ? 6000 : 4000);

    const newToast: ToastMessage = {
      ...toast,
      id,
      duration,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },

  showError: (error) => {
    if (isApiError(error)) {
      const toast: Omit<ToastMessage, "id"> = {
        type: "error",
        title: error.userSolvable ? "操作失败" : "系统错误",
        message: error.message,
        userSolvable: error.userSolvable,
        solution: error.solution,
      };
      get().showToast(toast);
    } else if (error instanceof Error) {
      get().showToast({
        type: "error",
        title: "操作失败",
        message: error.message,
        userSolvable: false,
      });
    } else {
      get().showToast({
        type: "error",
        title: "系统错误",
        message: "发生未知错误，请稍后重试",
        userSolvable: false,
      });
    }
  },

  showSuccess: (title, message) => {
    get().showToast({
      type: "success",
      title,
      message: message ?? "",
    });
  },
}));

export function createErrorToast(error: ApiError): Omit<ToastMessage, "id"> {
  return {
    type: "error",
    title: error.userSolvable ? "操作失败" : "系统错误",
    message: error.message,
    userSolvable: error.userSolvable,
    solution: error.solution,
  };
}

export default useToastStore;
