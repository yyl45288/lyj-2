import { useEffect } from "react";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { useToastStore } from "../store/useToastStore";
import { addErrorListener } from "../lib/api";

const iconMap = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  error: "bg-red-50 border-red-200 text-red-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconColorMap = {
  error: "text-red-500",
  success: "text-green-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
};

function ToastItem({ toast }: { toast: ReturnType<typeof useToastStore.getState>["toasts"][number] }) {
  const removeToast = useToastStore((state) => state.removeToast);
  const Icon = iconMap[toast.type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm animate-slide-in ${colorMap[toast.type]}`}
      style={{ minWidth: "320px", maxWidth: "480px" }}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColorMap[toast.type]}`} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{toast.title}</div>
        {toast.message && <div className="text-sm mt-1 opacity-90">{toast.message}</div>}
        {toast.userSolvable !== undefined && toast.solution && (
          <div className={`text-sm mt-2 p-2 rounded ${toast.userSolvable ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
            {toast.userSolvable ? (
              <>
                <span className="font-medium">解决方法：</span>
                {toast.solution}
              </>
            ) : (
              <>
                <span className="font-medium">提示：</span>
                此问题无法自行解决，请联系管理员。
              </>
            )}
          </div>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 ml-2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="关闭"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const showError = useToastStore((state) => state.showError);

  useEffect(() => {
    const removeListener = addErrorListener((error) => {
      showError(error);
    });
    return removeListener;
  }, [showError]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
