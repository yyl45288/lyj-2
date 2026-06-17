import { X, AlertTriangle, Phone, Mail } from "lucide-react";
import type { ApiError } from "../lib/error";

interface ErrorModalProps {
  error: ApiError | null;
  onClose: () => void;
}

export default function ErrorModal({ error, onClose }: ErrorModalProps) {
  if (!error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className={`p-6 ${error.userSolvable ? "bg-amber-50" : "bg-red-50"}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle
                className={`w-8 h-8 ${error.userSolvable ? "text-amber-500" : "text-red-500"}`}
              />
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {error.userSolvable ? "操作遇到问题" : "系统错误"}
                </h3>
                <p className="text-sm text-gray-600">
                  错误代码: {error.code}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-800 font-medium">{error.message}</p>
          </div>

          {error.userSolvable && error.solution && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">您可以尝试以下方法解决：</span>
              </p>
              <p className="text-sm text-blue-700 mt-1">{error.solution}</p>
            </div>
          )}

          {!error.userSolvable && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-semibold">
                此问题无法自行解决，请联系管理员
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <Phone className="w-4 h-4" />
                  <span>客服电话：400-123-4567</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <Mail className="w-4 h-4" />
                  <span>客服邮箱：support@example.com</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            关闭
          </button>
          {error.userSolvable && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              我知道了
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
