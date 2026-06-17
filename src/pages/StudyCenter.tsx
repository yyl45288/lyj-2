import { useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  LogOut,
  MapPin,
  Clock,
  Sparkles,
  Calendar,
  History,
  ChevronDown,
} from "lucide-react";
import useAppStore from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { Seat } from "@/../../shared/types";

const TARGET_MINUTES = 25;
const TARGET_SECONDS = TARGET_MINUTES * 60;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function StudyCenter() {
  const {
    currentSession,
    rooms,
    studyRecords,
    loading,
    loadRooms,
    loadRoom,
    loadStudyRecords,
    doCheckIn,
    doCheckOut,
    pauseCurrentSession,
    resumeCurrentSession,
  } = useAppStore();

  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [selectedSeatId, setSelectedSeatId] = useState<string>("");
  const [tick, setTick] = useState(0);
  const [roomOpen, setRoomOpen] = useState(false);
  const [seatOpen, setSeatOpen] = useState(false);

  useEffect(() => {
    loadRooms();
    loadStudyRecords();
  }, [loadRooms, loadStudyRecords]);

  useEffect(() => {
    if (!selectedRoomId) return;
    const r = rooms.find((x) => x.id === selectedRoomId);
    if (!r || !r.seats || r.seats.length === 0) {
      loadRoom(selectedRoomId);
    }
  }, [selectedRoomId, rooms, loadRoom]);

  useEffect(() => {
    if (!currentSession?.roomId) return;
    const r = rooms.find((x) => x.id === currentSession.roomId);
    if (!r || !r.seats || r.seats.length === 0) {
      loadRoom(currentSession.roomId);
    }
  }, [currentSession?.roomId, rooms, loadRoom]);

  useEffect(() => {
    if (!currentSession || currentSession.isPaused) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [currentSession]);

  const displaySeconds = useMemo(() => {
    if (!currentSession) return 0;
    return currentSession.accumulatedSeconds + (currentSession.isPaused ? 0 : tick);
  }, [currentSession, tick]);

  useEffect(() => {
    if (currentSession && tick > 0 && !currentSession.isPaused) {
      currentSession.accumulatedSeconds = displaySeconds;
    }
  }, [displaySeconds, currentSession, tick]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  const availableSeats = useMemo<Seat[]>(() => {
    if (!selectedRoom || !selectedRoom.seats) return [];
    return selectedRoom.seats.flat().filter((s) => s.status === "available");
  }, [selectedRoom]);

  const currentRoom = useMemo(
    () => rooms.find((r) => r.id === currentSession?.roomId),
    [rooms, currentSession]
  );

  const currentSeat = useMemo(() => {
    if (!currentRoom || !currentRoom.seats || !currentSession) return null;
    return currentRoom.seats.flat().find((s) => s.id === currentSession.seatId);
  }, [currentRoom, currentSession]);

  const progress = Math.min(displaySeconds / TARGET_SECONDS, 1);
  const expectedPoints = Math.floor(displaySeconds / 600);
  const circumference = 2 * Math.PI * 110;
  const strokeDashoffset = circumference * (1 - progress);

  const statusText = currentSession
    ? currentSession.isPaused
      ? "已暂停"
      : "正在学习中"
    : "未开始";

  const statusColor = currentSession
    ? currentSession.isPaused
      ? "text-amberGold-500"
      : "text-forest-600"
    : "text-cream-500";

  const todayRecords = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return studyRecords.filter((r) => {
      const d = new Date(r.checkInTime);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
  }, [studyRecords]);

  const todayMinutes = todayRecords.reduce((sum, r) => sum + r.durationMinutes, 0);
  const todayPoints = todayRecords.reduce((sum, r) => sum + r.pointsEarned, 0);

  const recentRecords = studyRecords.slice(0, 7);

  const handleCheckIn = async () => {
    if (!selectedRoomId || !selectedSeatId) return;
    try {
      setTick(0);
      await doCheckIn(selectedRoomId, selectedSeatId);
    } catch {
      // error handled in store
    }
  };

  const handleCheckOut = async () => {
    try {
      await doCheckOut();
      setTick(0);
      await loadStudyRecords();
    } catch {
      // error handled in store
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "rounded-xl px-4 py-3 flex items-center gap-3 font-medium",
          currentSession
            ? "bg-forest-50 text-forest-700 border border-forest-200"
            : "bg-cream-100 text-cream-500 border border-cream-200"
        )}
      >
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            currentSession
              ? currentSession.isPaused
                ? "bg-amberGold-400"
                : "bg-forest-500 animate-pulse"
              : "bg-cream-400"
          )}
        />
        <span>
          {currentSession
            ? currentSession.isPaused
              ? "⏸ 学习已暂停，点击继续恢复学习"
              : "🌿 正在学习中，保持专注，加油！"
            : "💤 当前未开始学习，选择座位后开启学习之旅"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-5 space-y-5">
            <h3 className="title-serif text-lg">选择位置</h3>

            <div className="space-y-2">
              <label className="text-sm text-cream-500 font-medium">自习室</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoomOpen(!roomOpen)}
                  disabled={!!currentSession}
                  className="w-full input-field flex items-center justify-between pr-10 disabled:opacity-60"
                >
                  <span className={!selectedRoom ? "text-cream-400" : ""}>
                    {selectedRoom ? selectedRoom.name : "请选择自习室"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400 transition-transform",
                      roomOpen && "rotate-180"
                    )}
                  />
                </button>
                {roomOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-cream-200 shadow-hover max-h-60 overflow-y-auto">
                    {rooms.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelectedRoomId(r.id);
                          setSelectedSeatId("");
                          setRoomOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left hover:bg-forest-50 transition-colors border-b border-cream-50 last:border-b-0",
                          selectedRoomId === r.id && "bg-forest-50 text-forest-700 font-medium"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{r.icon}</span>
                          <span>{r.name}</span>
                          <span className="text-xs text-cream-400 ml-auto">
                            {r.occupied}/{r.capacity}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-cream-500 font-medium">座位号</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSeatOpen(!seatOpen)}
                  disabled={!!currentSession || !selectedRoom}
                  className="w-full input-field flex items-center justify-between pr-10 disabled:opacity-60"
                >
                  <span className={!selectedSeatId ? "text-cream-400" : ""}>
                    {selectedSeatId
                      ? (() => {
                          const seat = selectedRoom?.seats
                            ?.flat()
                            .find((s) => s.id === selectedSeatId);
                          return seat
                            ? `第 ${seat.row + 1}排 第 ${seat.col + 1}座`
                            : "加载中...";
                        })()
                      : selectedRoom
                      ? availableSeats.length > 0
                        ? "请选择座位"
                        : "暂无可用座位"
                      : "请先选择自习室"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400 transition-transform",
                      seatOpen && "rotate-180"
                    )}
                  />
                </button>
                {seatOpen && selectedRoom && (
                  <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-cream-200 shadow-hover max-h-60 overflow-y-auto">
                    {availableSeats.length === 0 ? (
                      <div className="px-4 py-6 text-center text-cream-400 text-sm">
                        暂无可用座位
                      </div>
                    ) : (
                      availableSeats.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedSeatId(s.id);
                            setSeatOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2.5 text-left hover:bg-forest-50 transition-colors border-b border-cream-50 last:border-b-0",
                            selectedSeatId === s.id && "bg-forest-50 text-forest-700 font-medium"
                          )}
                        >
                          第 {s.row + 1}排 第 {s.col + 1}座
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="card p-8">
            <div className="flex flex-col items-center space-y-8">
              <div className="relative w-[260px] h-[260px] flex items-center justify-center">
                {currentSession && !currentSession.isPaused && (
                  <div className="absolute inset-0 rounded-full bg-forest-400/20 animate-pulse-ring" />
                )}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
                  <circle
                    cx="120"
                    cy="120"
                    r="110"
                    fill="none"
                    stroke="#F5F1E8"
                    strokeWidth="14"
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r="110"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#46907A" />
                      <stop offset="100%" stopColor="#D4A853" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                  <span className={cn("text-sm font-medium", statusColor)}>
                    {statusText}
                  </span>
                  <span className="text-4xl font-bold font-mono text-forest-800 tracking-wider">
                    {formatTime(displaySeconds)}
                  </span>
                  <div className="flex items-center gap-1 text-amberGold-500">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">预计 +{expectedPoints} 积分</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {!currentSession ? (
                  <button
                    onClick={handleCheckIn}
                    disabled={!selectedRoomId || !selectedSeatId}
                    className="btn-primary !px-10 !py-4 !text-lg"
                  >
                    <Play className="w-5 h-5" />
                    开始学习
                  </button>
                ) : currentSession.isPaused ? (
                  <>
                    <button onClick={resumeCurrentSession} className="btn-primary !px-8 !py-3.5">
                      <Play className="w-5 h-5" />
                      继续学习
                    </button>
                    <button onClick={handleCheckOut} className="btn-gold !px-8 !py-3.5">
                      <LogOut className="w-5 h-5" />
                      签退
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={pauseCurrentSession} className="btn-secondary !px-8 !py-3.5">
                      <Pause className="w-5 h-5" />
                      暂停
                    </button>
                    <button onClick={handleCheckOut} className="btn-gold !px-8 !py-3.5 !text-base font-semibold">
                      <LogOut className="w-5 h-5" />
                      结束学习
                    </button>
                  </>
                )}
              </div>

              <p className="text-xs text-cream-500">
                目标时长 {TARGET_MINUTES} 分钟 · 每 10 分钟积累 1 积分
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="title-serif text-lg">本次学习</h3>
            {currentSession ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-forest-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-cream-500 text-xs">位置</p>
                    <p className="font-medium text-forest-800">
                      {currentRoom?.name ?? "-"}
                    </p>
                    <p className="text-cream-500">
                      {currentSeat ? `第${currentSeat.row + 1}排 第${currentSeat.col + 1}座` : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-forest-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-cream-500 text-xs">签到时间</p>
                    <p className="font-medium text-forest-800">
                      {formatDateTime(currentSession.checkInTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-forest-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-cream-500 text-xs">已学习</p>
                    <p className="font-medium text-forest-800">
                      {formatTime(displaySeconds)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-cream-400 text-sm">
                开始学习后显示信息
              </div>
            )}
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="title-serif text-lg">今日累计</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-forest-50 p-4 text-center">
                <Clock className="w-5 h-5 text-forest-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-forest-700">{todayMinutes}</p>
                <p className="text-xs text-cream-500">分钟</p>
              </div>
              <div className="rounded-xl bg-amberGold-50 p-4 text-center">
                <Sparkles className="w-5 h-5 text-amberGold-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amberGold-600">{todayPoints}</p>
                <p className="text-xs text-cream-500">积分</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="title-serif text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-forest-500" />
            最近学习记录
          </h3>
          <span className="text-xs text-cream-500">最近 7 条</span>
        </div>

        {loading.studyRecords ? (
          <div className="py-12 text-center text-cream-400">加载中...</div>
        ) : recentRecords.length === 0 ? (
          <div className="py-12 text-center text-cream-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>暂无学习记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-100 text-cream-500">
                  <th className="text-left font-medium py-3 px-3">日期</th>
                  <th className="text-left font-medium py-3 px-3">自习室</th>
                  <th className="text-left font-medium py-3 px-3">座位</th>
                  <th className="text-left font-medium py-3 px-3">时长</th>
                  <th className="text-right font-medium py-3 px-3">积分</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-cream-50 hover:bg-cream-50/50 transition-colors"
                  >
                    <td className="py-3 px-3 text-forest-700">
                      {formatDateTime(r.checkInTime)}
                    </td>
                    <td className="py-3 px-3 text-forest-700">{r.roomName ?? "-"}</td>
                    <td className="py-3 px-3 text-forest-700">{r.seatLabel ?? "-"}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-forest-700">
                        <Clock className="w-3.5 h-3.5 text-cream-400" />
                        {r.durationMinutes} 分钟
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 font-medium text-amberGold-500">
                        <Sparkles className="w-3.5 h-3.5" />
                        +{r.pointsEarned}
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
  );
}
