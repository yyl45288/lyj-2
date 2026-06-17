import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  Clock,
  Calendar,
  ArrowRight,
  Sparkles,
  Flame,
  Trophy,
  User,
  GraduationCap,
  CalendarCheck,
} from "lucide-react";
import useAppStore from "@/store/useAppStore";
import StatCard from "@/components/StatCard";
import RoomCard from "@/components/RoomCard";
import { cn } from "@/lib/utils";

export default function Home() {
  const { userInfo, rooms, loading, loadUser, loadRooms } = useAppStore();

  useEffect(() => {
    loadUser();
    loadRooms();
  }, [loadUser, loadRooms]);

  const recommendedRooms = rooms.slice(0, 4);

  const quickEntries = [
    {
      to: "/study",
      label: "学习中心",
      icon: GraduationCap,
      gradient: "from-forest-500 to-forest-700",
      bg: "bg-forest-50",
      iconColor: "text-forest-600",
    },
    {
      to: "/leaderboard",
      label: "排行榜",
      icon: Trophy,
      gradient: "from-amberGold-400 to-amberGold-600",
      bg: "bg-amberGold-50",
      iconColor: "text-amberGold-500",
    },
    {
      to: "/rooms",
      label: "我的预约",
      icon: CalendarCheck,
      gradient: "from-purple-500 to-purple-700",
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      to: "/profile",
      label: "个人中心",
      icon: User,
      gradient: "from-blue-500 to-blue-700",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero 区 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-50 via-cream-50 to-amberGold-50 border border-cream-200 p-8 md:p-12">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-forest-200/40 to-forest-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-gradient-to-br from-amberGold-200/40 to-amberGold-400/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-purple-200/20 to-purple-400/10 blur-3xl" />

        <div className="relative grid lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-3 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-cream-200 shadow-soft">
              <Sparkles className="w-4 h-4 text-amberGold-500" />
              <span className="text-sm font-medium text-forest-700">
                全新上线 · 千万学习者的共同选择
              </span>
            </div>

            <h1 className="title-serif text-4xl md:text-5xl lg:text-6xl leading-tight">
              在自然中找到
              <span className="block bg-gradient-to-r from-forest-600 via-forest-500 to-amberGold-500 bg-clip-text text-transparent">
                专注
              </span>
            </h1>

            <p className="text-lg md:text-xl text-cream-500 max-w-lg leading-relaxed">
              与千万学习者同行，点亮每一个奋斗的夜晚
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/rooms" className="btn-primary px-6 py-3 text-base">
                立即预约座位
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/study" className="btn-secondary px-6 py-3 text-base">
                开始学习
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-forest-400/10 to-amberGold-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />

              <div className="relative space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-forest-400 via-forest-500 to-amberGold-400 p-[3px] shadow-card">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {userInfo?.avatar ? (
                          <img
                            src={userInfo.avatar}
                            alt={userInfo.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-cream-100 to-cream-200 flex items-center justify-center">
                            <User className="w-7 h-7 text-forest-600" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amberGold-400 to-amberGold-500 flex items-center justify-center shadow-soft border-2 border-white">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif font-semibold text-xl text-forest-800">
                      {loading.userInfo ? "加载中..." : userInfo?.username ?? "欢迎回来"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="chip bg-gradient-to-r from-forest-500 to-forest-600 text-white">
                        Lv.{userInfo?.level ?? 1}
                      </span>
                      <span className="text-sm text-cream-500">学习达人</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-amberGold-50 p-4 border border-amberGold-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-amberGold-500" />
                      <span className="text-sm text-amberGold-600 font-medium">积分</span>
                    </div>
                    <p className="text-2xl font-bold text-amberGold-600">
                      {loading.userInfo ? "..." : userInfo?.points?.toLocaleString() ?? 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-orange-50 p-4 border border-orange-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-orange-600 font-medium">连续签到</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {loading.userInfo ? "..." : (
                        <>
                          {userInfo?.streakDays ?? 0}
                          <span className="text-sm font-medium ml-1">天</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-cream-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cream-500">累计学习时长</span>
                    <span className="font-semibold text-forest-700">
                      {loading.userInfo ? "..." : (
                        <>
                          {Math.floor((userInfo?.totalStudyMinutes ?? 0) / 60)} 小时 {(userInfo?.totalStudyMinutes ?? 0) % 60} 分
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 统计区 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Users}
          label="总用户数"
          value="12,580"
          trend={12}
          color="forest"
        />
        <StatCard
          icon={BookOpen}
          label="正在学习人数"
          value="3,247"
          trend={8}
          color="amberGold"
        />
        <StatCard
          icon={Clock}
          label="今日总学时"
          value="9,862 小时"
          trend={5}
          color="purple"
        />
        <StatCard
          icon={Calendar}
          label="累计自习天数"
          value="1,024 天"
          trend={15}
          color="blue"
        />
      </section>

      {/* 推荐自习室 */}
      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="title-serif text-2xl md:text-3xl">推荐自习室</h2>
            <p className="text-cream-500 mt-1">精选热门自习空间，为你打造专注环境</p>
          </div>
          <Link to="/rooms" className="btn-outline">
            查看全部
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading.rooms ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card h-80 animate-pulse">
                <div className="h-36 bg-cream-100 rounded-t-2xl" />
                <div className="p-5 space-y-4">
                  <div className="h-6 bg-cream-100 rounded w-3/4" />
                  <div className="h-4 bg-cream-100 rounded w-1/2" />
                  <div className="h-2 bg-cream-100 rounded w-full" />
                  <div className="h-4 bg-cream-100 rounded w-full" />
                  <div className="h-10 bg-cream-100 rounded-lg w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommendedRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>

      {/* 快速入口 */}
      <section className="space-y-6">
        <div>
          <h2 className="title-serif text-2xl md:text-3xl">快速入口</h2>
          <p className="text-cream-500 mt-1">一键直达常用功能，高效学习不等待</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {quickEntries.map((entry) => (
            <Link
              key={entry.to}
              to={entry.to}
              className={cn(
                "card card-hover p-6 md:p-8 flex flex-col items-center text-center gap-4 group relative overflow-hidden"
              )}
            >
              <div
                className={cn(
                  "absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gradient-to-br opacity-10 blur-2xl group-hover:opacity-20 transition-opacity",
                  entry.gradient
                )}
              />
              <div
                className={cn(
                  "w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                  entry.bg
                )}
              >
                <entry.icon className={cn("w-8 h-8 md:w-10 md:h-10", entry.iconColor)} />
              </div>
              <span className="font-serif font-semibold text-lg text-forest-800">
                {entry.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
