import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Home,
  Building2,
  GraduationCap,
  Trophy,
  User,
  Sparkles,
  LogOut,
  UserCircle,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAppStore from "@/store/useAppStore";

const navItems = [
  { to: "/", label: "首页", icon: Home },
  { to: "/rooms", label: "自习室", icon: Building2 },
  { to: "/study", label: "学习中心", icon: GraduationCap },
  { to: "/leaderboard", label: "排行榜", icon: Trophy },
  { to: "/profile", label: "个人中心", icon: User },
];

export default function Navbar() {
  const { userInfo, isAuthenticated, logout } = useAppStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-cream-100 shadow-soft/40">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center shadow-soft group-hover:shadow-hover transition-shadow">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span
              className="font-serif font-bold text-xl text-forest-800 tracking-wide"
              style={{ fontFamily: '"Noto Serif SC", serif' }}
            >
              林间自习室
            </span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "nav-link",
                    isActive && "nav-link-active"
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <nav className="flex md:hidden items-center gap-1">
            {navItems.slice(0, 4).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg text-forest-700 hover:bg-forest-50 hover:text-forest-800 transition-all",
                    isActive && "bg-forest-100 text-forest-800"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated && userInfo ? (
              <>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amberGold-400 to-amberGold-500 text-white text-sm font-medium shadow-soft">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{userInfo.points ?? 0}</span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 via-forest-500 to-amberGold-400 p-[2px] shadow-soft">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {userInfo.avatar ? (
                          <img
                            src={userInfo.avatar}
                            alt={userInfo.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-cream-100 to-cream-200 flex items-center justify-center">
                            <User className="w-5 h-5 text-forest-600" />
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-cream-500 transition-transform hidden sm:block", menuOpen && "rotate-180")} />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-cream-200 shadow-hover py-2 z-50">
                      <div className="px-4 py-3 border-b border-cream-100">
                        <p className="font-medium text-forest-800 text-sm truncate">
                          {userInfo.username}
                        </p>
                        <p className="text-xs text-cream-500">
                          等级 {userInfo.level ?? 1}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/profile");
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-forest-700 hover:bg-forest-50 flex items-center gap-2 transition-colors"
                      >
                        <UserCircle className="w-4 h-4" />
                        个人中心
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  )}
                </div>

                <div className="sm:hidden absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amberGold-400 to-amberGold-500 flex items-center justify-center text-[10px] text-white font-bold shadow-soft">
                  {userInfo.points ?? 0}
                </div>
              </>
            ) : (
              <button
                onClick={handleLoginClick}
                className="btn-primary !py-2 !px-4 text-sm"
              >
                <User className="w-4 h-4" />
                登录
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
