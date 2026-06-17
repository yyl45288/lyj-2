import { NavLink } from "react-router-dom";
import {
  BookOpen,
  Home,
  Building2,
  GraduationCap,
  Trophy,
  User,
  Sparkles,
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
  const { userInfo } = useAppStore();

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
            {navItems.map((item) => (
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
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amberGold-400 to-amberGold-500 text-white text-sm font-medium shadow-soft">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{userInfo?.points ?? 0}</span>
            </div>

            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 via-forest-500 to-amberGold-400 p-[2px] shadow-soft">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {userInfo?.avatar ? (
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
              <div className="sm:hidden absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amberGold-400 to-amberGold-500 flex items-center justify-center text-[10px] text-white font-bold shadow-soft">
                {userInfo?.points ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
