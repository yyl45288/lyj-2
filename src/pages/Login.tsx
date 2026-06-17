import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, User, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import useAppStore from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import useToastStore from "@/store/useToastStore";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loading } = useAppStore();
  const { showError } = useToastStore();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string>("");

  const from = (location.state as { from?: string })?.from || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!username.trim()) {
      setLocalError("请输入用户名");
      return;
    }
    if (!password) {
      setLocalError("请输入密码");
      return;
    }

    if (mode === "register") {
      if (username.length < 2 || username.length > 20) {
        setLocalError("用户名长度需在 2-20 个字符");
        return;
      }
      if (password.length < 6) {
        setLocalError("密码长度不能少于 6 位");
        return;
      }
    }

    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      showError(err);
    }
  };

  const displayError = localError;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-forest-50/50 via-cream-50 to-amberGold-50/50">
      <div className="w-full max-w-md">
        <div className="card p-8 space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center shadow-soft">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="text-center space-y-1">
              <h1 className="title-serif text-2xl text-forest-800">林间自习室</h1>
              <p className="text-sm text-cream-500">
                {mode === "login" ? "欢迎回来，继续你的学习之旅" : "创建账号，开启学习之旅"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {displayError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {displayError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-forest-700">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cream-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full input-field pl-10 pr-4"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-forest-700">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cream-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-400 hover:text-cream-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {mode === "register" && (
                <p className="text-xs text-cream-400">密码长度至少 6 位</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading.auth}
              className="w-full btn-primary py-3 text-base"
            >
              {loading.auth ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === "login" ? "登录中..." : "注册中..."}
                </>
              ) : (
                <>{mode === "login" ? "登 录" : "注 册"}</>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-cream-500">
              {mode === "login" ? "还没有账号？" : "已有账号？"}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setLocalError("");
                }}
                className="ml-1 text-forest-600 hover:text-forest-700 font-medium transition-colors"
              >
                {mode === "login" ? "立即注册" : "立即登录"}
              </button>
            </p>
          </div>

          <div className="pt-4 border-t border-cream-100">
            <p className="text-xs text-center text-cream-400 mb-3">
              演示账号（密码均为 123456）
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["学习小达人", "知识探索者", "星辰大海"].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setUsername(name);
                    setPassword("123456");
                    setMode("login");
                    setLocalError("");
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs border transition-all",
                    username === name
                      ? "bg-forest-100 text-forest-700 border-forest-200"
                      : "bg-white text-cream-500 border-cream-200 hover:border-forest-200 hover:text-forest-600"
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
