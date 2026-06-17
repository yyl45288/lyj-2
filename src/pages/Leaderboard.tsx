import { useState, useEffect, useMemo } from "react";
import { Trophy, Clock, Sparkles, Crown, Medal, User, ArrowUp } from "lucide-react";
import useAppStore from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { LeaderboardPeriod, LeaderboardItem } from "@/../../shared/types";

const PERIOD_TABS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "daily", label: "日榜" },
  { key: "weekly", label: "周榜" },
  { key: "monthly", label: "月榜" },
];

const PODIUM_CONFIG = [
  { rank: 2, margin: "mt-10", gradient: "from-slate-300 via-slate-400 to-slate-500", emoji: "🥈", label: "亚军" },
  { rank: 1, margin: "mt-0", gradient: "from-amberGold-300 via-amberGold-400 to-amberGold-500", emoji: "🏆", label: "冠军" },
  { rank: 3, margin: "mt-16", gradient: "from-orange-300 via-orange-400 to-orange-500", emoji: "🥉", label: "季军" },
];

function getLevelBadge(points: number): { label: string; color: string } {
  if (points >= 2000) return { label: "Lv.5 传奇", color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" };
  if (points >= 1000) return { label: "Lv.4 大师", color: "bg-gradient-to-r from-amberGold-400 to-amberGold-500 text-white" };
  if (points >= 500) return { label: "Lv.3 达人", color: "bg-gradient-to-r from-forest-400 to-forest-600 text-white" };
  if (points >= 200) return { label: "Lv.2 进阶", color: "bg-gradient-to-r from-blue-400 to-blue-600 text-white" };
  return { label: "Lv.1 新手", color: "bg-cream-100 text-forest-700 border border-cream-200" };
}

export default function Leaderboard() {
  const { leaderboard, userInfo, loading, loadLeaderboard } = useAppStore();
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>("weekly");

  useEffect(() => {
    loadLeaderboard(activePeriod);
  }, [loadLeaderboard, activePeriod]);

  const currentList = useMemo(
    () => leaderboard[activePeriod] ?? [],
    [leaderboard, activePeriod]
  );

  const top3 = useMemo(() => {
    return [1, 2, 3].map((rank) => ({
      rank,
      item: currentList.find((i) => i.rank === rank) ?? null,
    }));
  }, [currentList]);

  const restList = useMemo(
    () => currentList.filter((i) => i.rank >= 4 && i.rank <= 20),
    [currentList]
  );

  const myRankItem = useMemo(
    () => currentList.find((i) => i.userId === "user_self"),
    [currentList]
  );

  const nextRankItem = useMemo(() => {
    if (!myRankItem) return null;
    return currentList.find((i) => i.rank === myRankItem.rank - 1);
  }, [myRankItem, currentList]);

  const pointsGap = useMemo(() => {
    if (!myRankItem || !nextRankItem) return 0;
    return nextRankItem.points - myRankItem.points;
  }, [myRankItem, nextRankItem]);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="title-serif text-4xl flex items-center justify-center gap-3">
          <Trophy className="w-10 h-10 text-amberGold-500" />
          学习排行榜
        </h1>
        <p className="text-cream-500">看看谁是本周最努力的同学 ✨</p>
      </div>

      <div className="flex justify-center">
        <div className="relative inline-flex items-center bg-cream-100 rounded-xl p-1">
          <div
            className={cn(
              "absolute top-1 bottom-1 w-[calc(33.333%-4px)] rounded-lg bg-white shadow-soft transition-all duration-500 ease-out",
              activePeriod === "daily" && "left-1",
              activePeriod === "weekly" && "left-[calc(33.333%+2px)]",
              activePeriod === "monthly" && "left-[calc(66.666%+0px)]"
            )}
          />
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActivePeriod(tab.key)}
              className={cn(
                "relative z-10 px-6 py-2 text-sm font-medium rounded-lg transition-colors",
                activePeriod === tab.key
                  ? "text-forest-700"
                  : "text-cream-500 hover:text-forest-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-8">
          <div className="flex items-end justify-center gap-4 md:gap-6 pt-6 pb-2">
            {PODIUM_CONFIG.map((cfg, idx) => {
              const topItem = top3.find((t) => t.rank === cfg.rank)?.item;
              return (
                <div
                  key={cfg.rank}
                  className={cn(
                    "flex flex-col items-center w-28 md:w-36 transition-all duration-500",
                    cfg.margin
                  )}
                >
                  <div
                    className={cn(
                      "absolute -top-2 text-2xl md:text-3xl animate-float",
                      idx === 0 ? "left-1/2 -translate-x-1/2" : ""
                    )}
                  >
                    {idx === 1 ? <Crown className="w-8 h-8 md:w-10 md:h-10 text-amberGold-500 drop-shadow-md mb-1" /> : null}
                  </div>
                  <div className="relative mb-3">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-1 shadow-card bg-gradient-to-br from-white to-cream-50">
                      <div
                        className={cn(
                          "w-full h-full rounded-full overflow-hidden flex items-center justify-center",
                          `bg-gradient-to-br ${cfg.gradient}`
                        )}
                      >
                        {topItem?.avatar ? (
                          <img src={topItem.avatar} alt={topItem.username} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 md:w-10 md:h-10 text-white/90" />
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white shadow-soft flex items-center justify-center text-lg md:text-xl">
                      {cfg.emoji}
                    </div>
                  </div>

                  <div className="text-center space-y-1 mb-3">
                    <p className="font-semibold text-forest-800 truncate max-w-[8rem]">
                      {topItem?.username ?? "虚位以待"}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amberGold-500" />
                      <span className="font-bold text-amberGold-600">
                        {topItem?.points ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs text-cream-500">
                      <Clock className="w-3 h-3" />
                      <span>{topItem?.studyMinutes ?? 0} 分钟</span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "w-full rounded-t-xl pt-4 pb-3 text-center text-white font-bold text-lg bg-gradient-to-t shadow-soft",
                      cfg.gradient
                    )}
                  >
                    {cfg.label}
                    <div className="text-xs font-normal opacity-90 mt-0.5">#{cfg.rank}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="title-serif text-lg flex items-center gap-2">
              <Medal className="w-5 h-5 text-forest-500" />
              完整榜单
              <span className="text-xs text-cream-400 font-normal">TOP 4-20</span>
            </h3>

            {loading.leaderboard ? (
              <div className="py-12 text-center text-cream-400">加载中...</div>
            ) : restList.length === 0 ? (
              <div className="py-12 text-center text-cream-400">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>暂无更多排名数据</p>
              </div>
            ) : (
              <div className="space-y-2">
                {restList.map((item) => (
                  <RankRow key={item.userId} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5 space-y-4 overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-amberGold-200/50 to-forest-200/50 blur-3xl" />
            <h3 className="title-serif text-lg flex items-center gap-2 relative">
              <User className="w-5 h-5 text-forest-500" />
              我的排名
            </h3>

            {myRankItem ? (
              <div className="relative space-y-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-forest-400 to-amberGold-400 shadow-soft">
                      <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                        {userInfo?.avatar ? (
                          <img src={userInfo.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-7 h-7 text-forest-600" />
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 min-w-[2.5rem] px-2 h-7 rounded-full bg-gradient-to-r from-forest-500 to-forest-600 text-white text-xs font-bold flex items-center justify-center shadow-soft">
                      #{myRankItem.rank}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold text-forest-800 truncate">
                      {userInfo?.username ?? "我"}
                    </p>
                    <span className={cn("chip", getLevelBadge(myRankItem.points).color)}>
                      {getLevelBadge(myRankItem.points).label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-amberGold-50 p-3 text-center">
                    <Sparkles className="w-4 h-4 text-amberGold-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-amberGold-600">
                      {myRankItem.points}
                    </p>
                    <p className="text-xs text-cream-500">积分</p>
                  </div>
                  <div className="rounded-xl bg-forest-50 p-3 text-center">
                    <Clock className="w-4 h-4 text-forest-500 mx-auto mb-1" />
                    <p className="text-xl font-bold text-forest-700">
                      {myRankItem.studyMinutes}
                    </p>
                    <p className="text-xs text-cream-500">分钟</p>
                  </div>
                </div>

                {pointsGap > 0 ? (
                  <div className="rounded-xl bg-gradient-to-r from-forest-50 to-amberGold-50 border border-forest-100 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-forest-700">
                      <ArrowUp className="w-4 h-4 text-amberGold-500" />
                      <span>距离上一名还差</span>
                      <span className="ml-auto text-xl font-bold text-amberGold-500">
                        {pointsGap}
                      </span>
                      <Sparkles className="w-4 h-4 text-amberGold-500" />
                    </div>
                    <p className="text-xs text-cream-500">
                      再努力一点点就能超越 #{myRankItem.rank - 1} 名！
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-gradient-to-r from-amberGold-50 to-forest-50 border border-amberGold-200 p-4 text-center">
                    <Crown className="w-6 h-6 text-amberGold-500 mx-auto mb-1" />
                    <p className="text-sm font-medium text-amberGold-700">
                      你已经是领先者，保持住！
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-cream-400 relative">
                <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无您的排名数据</p>
                <p className="text-xs mt-1">完成学习后即可上榜</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RankRow({ item }: { item: LeaderboardItem }) {
  const isSelf = item.userId === "user_self";
  const badge = getLevelBadge(item.points);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-cream-50 border-2",
        isSelf
          ? "bg-blue-50/50 border-blue-300 shadow-soft"
          : "border-transparent"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0",
          item.rank <= 10
            ? "bg-gradient-to-br from-forest-50 to-forest-100 text-forest-700"
            : "bg-cream-100 text-cream-500"
        )}
      >
        {item.rank}
      </div>

      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-forest-100 to-cream-100 flex items-center justify-center flex-shrink-0">
        {item.avatar ? (
          <img src={item.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <User className="w-5 h-5 text-forest-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "font-medium truncate cursor-pointer hover:underline",
              isSelf ? "text-blue-700" : "text-forest-800"
            )}
          >
            {item.username}
            {isSelf && <span className="text-xs text-blue-500">(我)</span>}
          </p>
        </div>
        <div className="mt-1">
          <span className={cn("chip !text-[10px] !px-2 !py-0.5", badge.color)}>
            {badge.label}
          </span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="flex items-center justify-end gap-1 text-amberGold-600 font-bold">
          <Sparkles className="w-4 h-4" />
          <span>{item.points}</span>
        </div>
        <div className="flex items-center justify-end gap-1 text-xs text-cream-500 mt-0.5">
          <Clock className="w-3 h-3" />
          <span>{item.studyMinutes}分</span>
        </div>
      </div>
    </div>
  );
}
