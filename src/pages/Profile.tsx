import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Clock,
  Flame,
  Calendar,
  Award,
  Lock,
  User,
  MapPin,
  BarChart3,
  CheckCircle2,
  BookOpen,
  Star,
  TrendingUp,
  Coffee,
  Rocket,
} from "lucide-react";
import useAppStore from "@/store/useAppStore";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PointLog, Badge } from "@/../../shared/types";

type TabKey = "records" | "points" | "badges";

const TABS: { key: TabKey; label: string; icon: typeof Calendar }[] = [
  { key: "records", label: "学习记录", icon: Calendar },
  { key: "points", label: "积分明细", icon: Sparkles },
  { key: "badges", label: "成就徽章", icon: Award },
];

const HEAT_COLORS = [
  "bg-cream-100",
  "bg-forest-200",
  "bg-forest-400",
  "bg-forest-500",
  "bg-forest-700",
];

function getHeatIndex(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes <= 30) return 1;
  if (minutes <= 60) return 2;
  if (minutes <= 120) return 3;
  return 4;
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const MOCK_BADGES: Badge[] = [
  { id: "1", name: "初来乍到", description: "完成首次签到", icon: "🌟", unlocked: true, unlockedAt: "2024-01-01" },
  { id: "2", name: "学习达人", description: "累计学习 10 小时", icon: "📚", unlocked: true, unlockedAt: "2024-01-15" },
  { id: "3", name: "七日坚持", description: "连续学习 7 天", icon: "🔥", unlocked: true, unlockedAt: "2024-02-01" },
  { id: "4", name: "月度冠军", description: "月榜排名第一", icon: "🏆", unlocked: true, unlockedAt: "2024-03-01" },
  { id: "5", name: "晨光使者", description: "早上 7 点前签到 10 次", icon: "🌅", unlocked: true, unlockedAt: "2024-03-15" },
  { id: "6", name: "夜猫子", description: "晚上 11 点后学习 20 次", icon: "🌙", unlocked: true, unlockedAt: "2024-04-01" },
  { id: "7", name: "社交达人", description: "添加 10 位好友", icon: "🤝", unlocked: false },
  { id: "8", name: "专注大师", description: "单次学习 2 小时", icon: "🎯", unlocked: false },
  { id: "9", name: "百日挑战", description: "连续学习 100 天", icon: "💯", unlocked: false },
  { id: "10", name: "满分王者", description: "积分突破 5000", icon: "👑", unlocked: false },
  { id: "11", name: "自习常客", description: "使用 10 个不同座位", icon: "🪑", unlocked: false },
  { id: "12", name: "探索者", description: "进入所有类型自习室", icon: "🧭", unlocked: false },
];

function getBadgeProgress(id: string): { current: number; total: number } {
  const map: Record<string, { current: number; total: number }> = {
    "7": { current: 3, total: 10 },
    "8": { current: 1, total: 1 },
    "9": { current: 12, total: 100 },
    "10": { current: 1280, total: 5000 },
    "11": { current: 4, total: 10 },
    "12": { current: 2, total: 4 },
  };
  return map[id] ?? { current: 0, total: 1 };
}

export default function Profile() {
  const { userInfo, studyRecords, loading, loadUser, loadStudyRecords } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>("records");
  const [pointLogs, setPointLogs] = useState<PointLog[]>([]);
  const [allBadges] = useState<Badge[]>(MOCK_BADGES);

  useEffect(() => {
    loadUser();
    loadStudyRecords();
    api.fetchPoints("user_self").then(setPointLogs).catch(() => {});
  }, [loadUser, loadStudyRecords]);

  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();
    studyRecords.forEach((r) => {
      const d = new Date(r.checkInTime);
      const key = formatDateKey(d);
      map.set(key, (map.get(key) ?? 0) + r.durationMinutes);
    });

    const weeks: { date: Date; minutes: number }[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let w = 11; w >= 0; w--) {
      const week: { date: Date; minutes: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - w * 7 - (6 - d));
        const key = formatDateKey(date);
        week.push({ date, minutes: map.get(key) ?? 0 });
      }
      weeks.push(week);
    }
    return weeks;
  }, [studyRecords]);

  const recent10 = useMemo(() => studyRecords.slice(0, 10), [studyRecords]);

  const pointBreakdown = useMemo(() => {
    const studyPoints = Math.floor((userInfo?.points ?? 0) * 0.9);
    const checkInPoints = Math.floor((userInfo?.points ?? 0) * 0.08);
    const otherPoints = (userInfo?.points ?? 0) - studyPoints - checkInPoints;
    return [
      { label: "学习时长", value: studyPoints, pct: 90, color: "bg-forest-500", icon: BookOpen },
      { label: "签到奖励", value: checkInPoints, pct: 8, color: "bg-amberGold-400", icon: Star },
      { label: "其他", value: otherPoints, pct: 2, color: "bg-purple-500", icon: TrendingUp },
    ];
  }, [userInfo]);

  const level = userInfo?.level ?? 1;

  return (
    <div className="space-y-6">
      <div className="card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-forest-200/40 via-amberGold-200/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="relative grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 flex md:block items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-[3px] bg-gradient-to-br from-forest-400 via-forest-500 to-amberGold-400 shadow-card animate-breathe">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-cream-50 via-white to-cream-100 flex items-center justify-center overflow-hidden">
                  {userInfo?.avatar ? (
                    <img src={userInfo.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 md:w-14 md:h-14 text-forest-500" />
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-forest-500 to-forest-600 text-white text-xs font-bold shadow-soft whitespace-nowrap">
                Lv.{level}
              </div>
            </div>
            <div className="md:mt-6 md:text-left text-center space-y-2 flex-1 md:flex-none">
              <h1 className="title-serif text-2xl md:text-3xl">{userInfo?.username ?? "林间学者"}</h1>
              <p className="text-sm text-cream-500">
                {userInfo?.badges?.length ?? 0} 枚徽章 · 继续加油 🌿
              </p>
              <p className="text-sm text-forest-600 italic">
                "学而时习之，不亦说乎。"
              </p>
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-3 gap-3 md:gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-amberGold-50 to-white border border-amberGold-100 p-4 md:p-5 text-center card-hover">
              <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-amberGold-500 mx-auto mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-amberGold-600">
                {(userInfo?.points ?? 0).toLocaleString()}
              </p>
              <p className="text-xs md:text-sm text-cream-500 mt-1">总积分</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-forest-50 to-white border border-forest-100 p-4 md:p-5 text-center card-hover">
              <Clock className="w-6 h-6 md:w-7 md:h-7 text-forest-500 mx-auto mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-forest-700">
                {(userInfo?.totalStudyMinutes ?? 0).toLocaleString()}
              </p>
              <p className="text-xs md:text-sm text-cream-500 mt-1">总学时(分)</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 p-4 md:p-5 text-center card-hover">
              <Flame className="w-6 h-6 md:w-7 md:h-7 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-orange-600">
                {userInfo?.streakDays ?? 0}
              </p>
              <p className="text-xs md:text-sm text-cream-500 mt-1">连续天数</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center border-b border-cream-100">
        <div className="flex items-center gap-1 relative">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const idx = TABS.findIndex((t) => t.key === tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative z-10 flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all",
                  isActive
                    ? "border-forest-500 text-forest-700"
                    : "border-transparent text-cream-500 hover:text-forest-600"
                )}
                style={{ marginLeft: idx === 0 ? 0 : undefined }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "records" && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="title-serif text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-forest-500" />
                学习热力图
              </h3>
              <div className="flex items-center gap-2 text-xs text-cream-500">
                <span>少</span>
                {HEAT_COLORS.map((c, i) => (
                  <div key={i} className={cn("w-3.5 h-3.5 rounded-sm", c)} />
                ))}
                <span>多</span>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1.5 min-w-max">
                {heatmapData.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1.5">
                    {week.map((day, di) => {
                      const isToday = formatDateKey(day.date) === formatDateKey(new Date());
                      return (
                        <div
                          key={di}
                          title={`${formatDateKey(day.date)}: ${day.minutes} 分钟`}
                          className={cn(
                            "w-4 h-4 md:w-5 md:h-5 rounded-sm transition-all hover:scale-125 cursor-pointer",
                            HEAT_COLORS[getHeatIndex(day.minutes)],
                            isToday && "ring-2 ring-forest-500 ring-offset-1"
                          )}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 mt-2 text-[10px] text-cream-400">
                {heatmapData.map((_, wi) => {
                  if (wi % 3 !== 0) return <div key={wi} className="w-4 md:w-5" />;
                  const date = heatmapData[wi][0].date;
                  return (
                    <div key={wi} className="w-4 md:w-5 text-center" style={{ minWidth: wi % 3 === 0 ? undefined : undefined }}>
                      {date.getMonth() + 1}月
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="title-serif text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-forest-500" />
                最近学习记录
              </h3>
              <span className="text-xs text-cream-500">最近 10 条</span>
            </div>

            {loading.studyRecords ? (
              <div className="py-10 text-center text-cream-400">加载中...</div>
            ) : recent10.length === 0 ? (
              <div className="py-10 text-center text-cream-400">
                <Coffee className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">还没有学习记录，开始第一次学习吧！</p>
              </div>
            ) : (
              <div className="divide-y divide-cream-50">
                {recent10.map((r) => (
                  <div
                    key={r.id}
                    className="py-3 flex items-center gap-4 hover:bg-cream-50/50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-forest-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-forest-800 truncate">
                          {r.roomName ?? "-"}
                        </p>
                        <span className="chip bg-cream-50 text-cream-500 border-cream-100 !text-[10px]">
                          {r.seatLabel ?? "座位"}
                        </span>
                      </div>
                      <p className="text-xs text-cream-500 mt-0.5">
                        {formatDateTime(r.checkInTime)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center justify-end gap-1 text-forest-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-cream-400" />
                        {r.durationMinutes} 分
                      </div>
                      <div className="flex items-center justify-end gap-1 text-amberGold-500 text-sm mt-0.5">
                        <Sparkles className="w-3 h-3" />
                        +{r.pointsEarned}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "points" && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card p-5 md:p-6 space-y-5">
            <h3 className="title-serif text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-forest-500" />
              积分来源构成
            </h3>

            <div className="space-y-2">
              <div className="h-6 w-full rounded-full bg-cream-100 overflow-hidden flex">
                {pointBreakdown.map((item) => (
                  <div
                    key={item.label}
                    className={cn("h-full transition-all duration-700", item.color)}
                    style={{ width: `${item.pct}%` }}
                    title={`${item.label}: ${item.value}`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {pointBreakdown.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="text-center">
                      <div className={cn("w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-2", item.color + "/20")}>
                        <Icon className={cn("w-4 h-4", item.color.replace("bg-", "text-"))} />
                      </div>
                      <p className="text-xs text-cream-500">{item.label}</p>
                      <p className="font-bold text-forest-800">{item.value}</p>
                      <p className="text-xs text-cream-400">{item.pct}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card p-5 md:p-6 space-y-4">
            <h3 className="title-serif text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amberGold-500" />
              积分日志
            </h3>

            {pointLogs.length === 0 ? (
              <div className="py-10 text-center text-cream-400">
                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无积分记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-100 text-cream-500">
                      <th className="text-left font-medium py-3 px-3">时间</th>
                      <th className="text-left font-medium py-3 px-3">事由</th>
                      <th className="text-right font-medium py-3 px-3">积分变化</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-cream-50 hover:bg-cream-50/50 transition-colors"
                      >
                        <td className="py-3 px-3 text-forest-700 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="py-3 px-3 text-forest-700">{log.reason}</td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={cn(
                              "font-semibold inline-flex items-center gap-1",
                              log.amount >= 0 ? "text-amberGold-500" : "text-red-500"
                            )}
                          >
                            {log.amount >= 0 ? (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />+
                              </>
                            ) : null}
                            {log.amount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "badges" && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="title-serif text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-amberGold-500" />
                成就徽章
              </h3>
              <span className="chip bg-forest-50 text-forest-700 border-forest-200">
                <CheckCircle2 className="w-3 h-3" />
                已解锁 {allBadges.filter((b) => b.unlocked).length} / {allBadges.length}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allBadges.map((badge) => {
                const progress = getBadgeProgress(badge.id);
                const pct = Math.min(100, Math.floor((progress.current / progress.total) * 100));
                return (
                  <div
                    key={badge.id}
                    className={cn(
                      "rounded-2xl p-4 md:p-5 text-center relative overflow-hidden transition-all card-hover",
                      badge.unlocked
                        ? "bg-gradient-to-br from-white via-cream-50 to-amberGold-50 border border-amberGold-100 shadow-card"
                        : "bg-cream-50/50 border border-cream-100"
                    )}
                  >
                    {badge.unlocked && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-amberGold-500" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl flex items-center justify-center mb-3 text-3xl md:text-4xl relative",
                        badge.unlocked
                          ? "bg-gradient-to-br from-amberGold-100 via-amberGold-200/50 to-forest-100 shadow-soft"
                          : "bg-cream-100 grayscale"
                      )}
                    >
                      <span className={cn(!badge.unlocked && "opacity-40")}>
                        {badge.icon}
                      </span>
                      {!badge.unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-soft">
                            <Lock className="w-4 h-4 text-cream-500" />
                          </div>
                        </div>
                      )}
                    </div>

                    <p
                      className={cn(
                        "font-semibold mb-1",
                        badge.unlocked ? "text-forest-800" : "text-cream-500"
                      )}
                    >
                      {badge.name}
                    </p>
                    <p
                      className={cn(
                        "text-xs leading-relaxed mb-3",
                        badge.unlocked ? "text-cream-500" : "text-cream-400"
                      )}
                    >
                      {badge.description}
                    </p>

                    {!badge.unlocked && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-cream-500">
                          <span>进度</span>
                          <span className="font-medium">
                            {progress.current} / {progress.total}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-cream-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-forest-400 to-forest-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {badge.unlocked && badge.unlockedAt && (
                      <p className="text-[10px] text-amberGold-500 flex items-center justify-center gap-1">
                        <Rocket className="w-3 h-3" />
                        解锁于 {new Date(badge.unlockedAt).toLocaleDateString("zh-CN")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
