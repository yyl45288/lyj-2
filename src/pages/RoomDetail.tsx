import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Monitor,
  Clock,
  CalendarClock,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  User,
  MapPin,
  Trash2,
  Loader2,
  LogIn,
} from "lucide-react";
import type { Seat, RoomType, SeatStatus } from "@/../../shared/types";
import useAppStore from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const roomTypeLabels: Record<RoomType, { label: string; className: string }> = {
  silent: {
    label: "静音区",
    className: "bg-forest-50 text-forest-700 border-forest-200",
  },
  reading: {
    label: "阅读区",
    className: "bg-amberGold-50 text-amberGold-600 border-amberGold-200",
  },
  focus: {
    label: "专注区",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  discussion: {
    label: "讨论区",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

const seatStyleMap: Record<
  SeatStatus,
  { container: string; label?: string }
> = {
  available: {
    container:
      "border-forest-400 bg-forest-50 text-forest-600 hover:bg-forest-100 hover:border-forest-500 hover:shadow-soft cursor-pointer",
  },
  occupied: {
    container:
      "border-cream-200 bg-cream-100 text-cream-400 cursor-not-allowed opacity-60",
    label: "使用中",
  },
  reserved: {
    container:
      "border-amberGold-400 bg-amberGold-50 text-amberGold-600 cursor-not-allowed",
    label: "已预约",
  },
  mine: {
    container:
      "border-blue-500 bg-blue-100 text-blue-700 shadow-soft ring-2 ring-blue-300",
    label: "我的",
  },
};

const legendItems: { status: SeatStatus; label: string }[] = [
  { status: "available", label: "可选" },
  { status: "occupied", label: "使用中" },
  { status: "reserved", label: "已预约" },
  { status: "mine", label: "我的座位" },
];

export default function RoomDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const {
    currentRoom,
    myReservations,
    loading,
    userInfo,
    isAuthenticated,
    loadRoom,
    loadMyReservations,
    doReserve,
    doCancelReservation,
  } = useAppStore();

  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [selectedTimeIdx, setSelectedTimeIdx] = useState(0);
  const [selectedDurationIdx, setSelectedDurationIdx] = useState(0);
  const [isReserving, setIsReserving] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadRoom(id);
    }
    loadMyReservations();
  }, [id, loadRoom, loadMyReservations]);

  const timeOptions = useMemo(() => {
    const now = new Date();
    return [
      {
        label: "现在",
        getTime: () => new Date(now),
      },
      {
        label: "1小时后",
        getTime: () => new Date(now.getTime() + 60 * 60 * 1000),
      },
      {
        label: "2小时后",
        getTime: () => new Date(now.getTime() + 2 * 60 * 60 * 1000),
      },
    ];
  }, []);

  const durationOptions = [1, 2, 3, 4];

  const startTime = useMemo(
    () => timeOptions[selectedTimeIdx].getTime(),
    [timeOptions, selectedTimeIdx]
  );
  const duration = durationOptions[selectedDurationIdx];
  const endTime = useMemo(
    () => new Date(startTime.getTime() + duration * 60 * 60 * 1000),
    [startTime, duration]
  );

  const roomSeats = useMemo(() => {
    if (!currentRoom) return [];
    const userId = isAuthenticated ? (userInfo?.id ?? "") : "";
    return currentRoom.seats.map((row) =>
      row.map((seat) => {
        if (
          userId &&
          ((seat.reservedBy === userId && seat.status === "reserved") ||
          (seat.occupiedBy === userId && seat.status === "occupied"))
        ) {
          return { ...seat, status: "mine" as SeatStatus };
        }
        return seat;
      })
    );
  }, [currentRoom, userInfo, isAuthenticated]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "available") {
      setSelectedSeat(seat);
    } else if (seat.status === "mine") {
      setSelectedSeat(seat);
    }
  };

  const handleLoginRedirect = () => {
    navigate("/login", { state: { from: `/rooms/${id}` } });
  };

  const handleReserve = async () => {
    if (!selectedSeat || !id) return;

    if (!isAuthenticated) {
      handleLoginRedirect();
      return;
    }

    setIsReserving(true);
    try {
      await doReserve(
        id,
        selectedSeat.id,
        startTime.toISOString(),
        endTime.toISOString()
      );
      setSelectedSeat(null);
      await loadRoom(id);
      await loadMyReservations();
    } catch (err) {
      alert(err instanceof Error ? err.message : "预约失败，请稍后重试");
    } finally {
      setIsReserving(false);
    }
  };

  const handleCancel = async (reservationId: string) => {
    setCancelingId(reservationId);
    try {
      await doCancelReservation(reservationId);
      if (id) {
        await loadRoom(id);
      }
    } catch (err) {
      console.error("取消失败", err);
    } finally {
      setCancelingId(null);
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `${month}/${day} ${hours}:${mins}`;
  };

  const pendingReservations = myReservations.filter(
    (r) => r.status === "pending" || r.status === "active"
  );

  if (loading.currentRoom && !currentRoom) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-forest-500 animate-spin" />
          <p className="text-cream-500">加载房间信息...</p>
        </div>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="card p-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-cream-100 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-cream-400" />
          </div>
          <div className="space-y-2">
            <h3 className="title-serif text-xl">房间不存在</h3>
            <p className="text-cream-500">该自习室可能已被移除或链接无效</p>
          </div>
          <Link to="/rooms" className="btn-primary">
            返回自习室列表
          </Link>
        </div>
      </div>
    );
  }

  const typeInfo = roomTypeLabels[currentRoom.type];
  const occupancyRate =
    currentRoom.capacity > 0
      ? (currentRoom.occupied / currentRoom.capacity) * 100
      : 0;
  const availableCount = currentRoom.capacity - currentRoom.occupied;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/rooms"
          className="text-cream-500 hover:text-forest-600 transition-colors"
        >
          自习室列表
        </Link>
        <ChevronRight className="w-4 h-4 text-cream-300" />
        <span className="text-forest-800 font-medium truncate">
          {currentRoom.name}
        </span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 md:p-8 overflow-hidden relative">
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10"
              style={{ backgroundColor: currentRoom.themeColor }}
            />

            <div className="relative space-y-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-card flex-shrink-0"
                  style={{ backgroundColor: currentRoom.themeColor }}
                >
                  <span className="text-5xl">{currentRoom.icon}</span>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="title-serif text-2xl md:text-3xl">
                      {currentRoom.name}
                    </h1>
                    <span
                      className={cn(
                        "chip border",
                        typeInfo.className
                      )}
                    >
                      {typeInfo.label}
                    </span>
                  </div>
                  <p className="text-cream-500 leading-relaxed">
                    {currentRoom.description}
                  </p>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-cream-500">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          容量 {currentRoom.capacity} 座
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          {availableCount > 0 ? (
                            <span className="text-forest-600 font-medium">
                              空闲 {availableCount} 座
                            </span>
                          ) : (
                            <span className="text-red-500 font-medium">
                              暂无空位
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="font-medium text-forest-700">
                        {currentRoom.occupied} / {currentRoom.capacity}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-cream-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${occupancyRate}%`,
                          backgroundColor:
                            occupancyRate >= 90
                              ? "#ef4444"
                              : occupancyRate >= 70
                              ? "#f59e0b"
                              : currentRoom.themeColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="title-serif text-xl">座位图</h2>
              <div className="flex flex-wrap items-center gap-4">
                {legendItems.map((item) => {
                  const style = seatStyleMap[item.status];
                  return (
                    <div key={item.status} className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg border-2 flex items-center justify-center text-[10px] font-medium",
                          style.container
                        )}
                      />
                      <span className="text-sm text-cream-500">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cream-50 to-cream-100 border border-cream-200">
                <Monitor className="w-5 h-5 text-forest-600" />
                <span className="font-medium text-forest-700">讲台 / 屏幕</span>
              </div>

              {roomSeats.length > 0 && (
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    <div className="flex">
                      <div className="w-8 flex-shrink-0" />
                      <div className="flex-1 grid gap-2" style={{
                        gridTemplateColumns: `repeat(${roomSeats[0].length}, minmax(0, 1fr))`
                      }}>
                        {Array.from({ length: roomSeats[0].length }, (_, i) => (
                          <div
                            key={i}
                            className="text-center text-xs text-cream-400 font-medium py-1"
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>

                    {roomSeats.map((row, rowIdx) => (
                      <div key={rowIdx} className="flex mt-2">
                        <div className="w-8 flex-shrink-0 flex items-center justify-center text-sm text-cream-400 font-medium">
                          {rowLabels[rowIdx] ?? rowIdx + 1}
                        </div>
                        <div
                          className="flex-1 grid gap-2"
                          style={{
                            gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`
                          }}
                        >
                          {row.map((seat) => {
                            const style = seatStyleMap[seat.status];
                            const isSelected =
                              selectedSeat?.id === seat.id &&
                              seat.status === "available";
                            const tooltipContent =
                              seat.status === "occupied"
                                ? `使用中: ${seat.occupiedBy ?? "其他用户"}`
                                : seat.status === "reserved"
                                ? "此座位已被预约"
                                : seat.status === "mine"
                                ? "这是你的座位"
                                : `${rowLabels[seat.row] ?? seat.row + 1}排${seat.col + 1}号 · 点击选择`;

                            return (
                              <button
                                key={seat.id}
                                onClick={() => handleSeatClick(seat)}
                                disabled={
                                  seat.status === "occupied" ||
                                  seat.status === "reserved"
                                }
                                title={tooltipContent}
                                className={cn(
                                  "relative aspect-square rounded-xl border-2 flex items-center justify-center text-xs font-semibold transition-all duration-200 min-h-[44px]",
                                  style.container,
                                  isSelected &&
                                    "ring-4 ring-forest-400/40 scale-105 z-10"
                                )}
                              >
                                {seat.col + 1}
                                {style.label && (
                                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0.5 rounded-full bg-white shadow-soft border border-cream-100 whitespace-nowrap">
                                    {style.label}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 md:p-8 space-y-6">
            <h2 className="title-serif text-xl">预约座位</h2>

            {selectedSeat ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-forest-50 border border-forest-100">
                  <CheckCircle2 className="w-6 h-6 text-forest-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-forest-800">
                      已选择座位: {rowLabels[selectedSeat.row] ?? selectedSeat.row + 1}排{selectedSeat.col + 1}号
                    </p>
                    <p className="text-sm text-forest-600">
                      请选择开始时间和预约时长
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSeat(null)}
                    className="ml-auto p-2 rounded-lg hover:bg-forest-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-forest-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-forest-800 mb-3">
                      <CalendarClock className="w-4 h-4" />
                      开始时间
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {timeOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTimeIdx(idx)}
                          className={cn(
                            "px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                            selectedTimeIdx === idx
                              ? "border-forest-500 bg-forest-50 text-forest-700 shadow-soft"
                              : "border-cream-200 bg-white text-cream-500 hover:border-cream-300 hover:bg-cream-50"
                          )}
                        >
                          <div>{opt.label}</div>
                          <div className="text-xs mt-1 opacity-80">
                            {opt
                              .getTime()
                              .toLocaleTimeString("zh-CN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-forest-800 mb-3">
                      <Clock className="w-4 h-4" />
                      预约时长
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {durationOptions.map((d, idx) => (
                        <button
                          key={d}
                          onClick={() => setSelectedDurationIdx(idx)}
                          className={cn(
                            "px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                            selectedDurationIdx === idx
                              ? "border-forest-500 bg-forest-50 text-forest-700 shadow-soft"
                              : "border-cream-200 bg-white text-cream-500 hover:border-cream-300 hover:bg-cream-50"
                          )}
                        >
                          {d} 小时
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cream-500">开始时间</span>
                      <span className="font-medium text-forest-700">
                        {startTime.toLocaleString("zh-CN", {
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cream-500">结束时间</span>
                      <span className="font-medium text-forest-700">
                        {endTime.toLocaleString("zh-CN", {
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-cream-200">
                      <span className="text-cream-500">预约时长</span>
                      <span className="font-semibold text-forest-800">
                        {duration} 小时
                      </span>
                    </div>
                  </div>

                  {isAuthenticated ? (
                    <button
                      onClick={handleReserve}
                      disabled={isReserving}
                      className="btn-primary w-full py-3.5 text-base"
                    >
                      {isReserving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          预约中...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          确认预约
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleLoginRedirect}
                      className="btn-primary w-full py-3.5 text-base"
                    >
                      <LogIn className="w-5 h-5" />
                      登录后预约
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-cream-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-forest-800">请先选择座位</p>
                  <p className="text-sm text-cream-500">
                    在上方座位图中点击绿色可选座位进行选择
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="title-serif text-lg">当前座位状态</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-forest-50 border border-forest-100">
                <p className="text-xs text-forest-600 mb-1">可用座位</p>
                <p className="text-2xl font-bold text-forest-700">
                  {availableCount}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amberGold-50 border border-amberGold-100">
                <p className="text-xs text-amberGold-600 mb-1">已使用</p>
                <p className="text-2xl font-bold text-amberGold-600">
                  {currentRoom.occupied}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-cream-500">使用率</span>
                <span className="font-semibold text-forest-700">
                  {occupancyRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-cream-200 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${occupancyRate}%`,
                    backgroundColor:
                      occupancyRate >= 90
                        ? "#ef4444"
                        : occupancyRate >= 70
                        ? "#f59e0b"
                        : currentRoom.themeColor,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="title-serif text-lg">我的预约</h3>
              {isAuthenticated && (
                <button
                  onClick={() => navigate("/profile")}
                  className="text-xs text-forest-600 hover:text-forest-700 font-medium"
                >
                  查看全部
                </button>
              )}
            </div>

            {!isAuthenticated ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center mx-auto">
                  <LogIn className="w-6 h-6 text-cream-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-forest-800">登录后查看预约</p>
                  <p className="text-xs text-cream-500">登录后即可管理你的座位预约</p>
                </div>
                <button
                  onClick={handleLoginRedirect}
                  className="btn-primary !py-2 !px-6 text-sm"
                >
                  立即登录
                </button>
              </div>
            ) : loading.myReservations ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 text-forest-500 animate-spin" />
              </div>
            ) : pendingReservations.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CalendarClock className="w-10 h-10 text-cream-300 mx-auto" />
                <p className="text-sm text-cream-500">暂无进行中的预约</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReservations.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl border border-cream-200 bg-cream-50/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium text-forest-800 truncate">
                          {r.roomName}
                        </p>
                        <p className="text-sm text-cream-500">
                          {r.seatLabel}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "chip flex-shrink-0",
                          r.status === "active"
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : "bg-amberGold-50 text-amberGold-600 border border-amberGold-100"
                        )}
                      >
                        {r.status === "active" ? "使用中" : "待使用"}
                      </span>
                    </div>
                    <div className="text-xs text-cream-500 space-y-0.5">
                      <p>开始: {formatDateTime(r.startTime)}</p>
                      <p>结束: {formatDateTime(r.endTime)}</p>
                    </div>
                    {r.status === "pending" && (
                      <button
                        onClick={() => handleCancel(r.id)}
                        disabled={cancelingId === r.id}
                        className="w-full mt-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {cancelingId === r.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        取消预约
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6 space-y-4 bg-gradient-to-br from-forest-50/50 to-amberGold-50/50">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amberGold-100 flex items-center justify-center">
                <Info className="w-5 h-5 text-amberGold-600" />
              </div>
              <h3 className="title-serif text-lg">房间规则</h3>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3 text-cream-600">
                <span className="text-amberGold-500 font-bold flex-shrink-0">
                  01
                </span>
                <span>
                  预约成功后请在15分钟内到达座位签到，超时将自动取消
                </span>
              </li>
              <li className="flex gap-3 text-cream-600">
                <span className="text-amberGold-500 font-bold flex-shrink-0">
                  02
                </span>
                <span>
                  请保持安静，手机调至静音模式，{typeInfo.label}需遵守相应规范
                </span>
              </li>
              <li className="flex gap-3 text-cream-600">
                <span className="text-amberGold-500 font-bold flex-shrink-0">
                  03
                </span>
                <span>
                  临时离开请设置「暂离」状态，超过30分钟将释放座位
                </span>
              </li>
              <li className="flex gap-3 text-cream-600">
                <span className="text-amberGold-500 font-bold flex-shrink-0">
                  04
                </span>
                <span>
                  请爱护公共设施，保持桌面整洁，共同营造良好学习氛围
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
