import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Flame,
  Users,
  DoorOpen,
  X,
} from "lucide-react";
import type { RoomType } from "@/../../shared/types";
import useAppStore from "@/store/useAppStore";
import RoomCard from "@/components/RoomCard";
import { cn } from "@/lib/utils";

type SortKey = "heat" | "capacity" | "available";

const typeFilters: { key: "all" | RoomType; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "silent", label: "安静" },
  { key: "reading", label: "阅读" },
  { key: "focus", label: "专注" },
  { key: "discussion", label: "讨论" },
];

const sortOptions: { key: SortKey; label: string; icon: typeof ArrowUpDown }[] = [
  { key: "heat", label: "按热度", icon: Flame },
  { key: "capacity", label: "按容量", icon: Users },
  { key: "available", label: "按空闲数", icon: DoorOpen },
];

export default function RoomsList() {
  const { rooms, loading, loadRooms } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | RoomType>("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("heat");

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const filteredRooms = useMemo(() => {
    let result = [...rooms];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (room) =>
          room.name.toLowerCase().includes(query) ||
          room.description.toLowerCase().includes(query)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((room) => room.type === typeFilter);
    }

    if (onlyAvailable) {
      result = result.filter((room) => room.occupied < room.capacity);
    }

    switch (sortBy) {
      case "heat":
        result.sort((a, b) => b.occupied - a.occupied);
        break;
      case "capacity":
        result.sort((a, b) => b.capacity - a.capacity);
        break;
      case "available":
        result.sort(
          (a, b) =>
            b.capacity - b.occupied - (a.capacity - a.occupied)
        );
        break;
    }

    return result;
  }, [rooms, searchQuery, typeFilter, onlyAvailable, sortBy]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="title-serif text-3xl md:text-4xl">自习室列表</h1>
        <p className="text-cream-500">
          找到适合你的学习空间，开启专注之旅
        </p>
      </div>

      <div className="card p-5 md:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cream-400" />
            <input
              type="text"
              placeholder="搜索自习室名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12 pr-12"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-cream-200 transition-colors"
              >
                <X className="w-4 h-4 text-cream-400" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-cream-500">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                筛选:
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors duration-200",
                    onlyAvailable ? "bg-forest-500" : "bg-cream-200"
                  )}
                />
                <div
                  className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-soft transition-transform duration-200",
                    onlyAvailable && "translate-x-5"
                  )}
                />
              </div>
              <span className="text-sm text-forest-700 font-medium whitespace-nowrap">
                只看有空位
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {typeFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setTypeFilter(filter.key)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  typeFilter === filter.key
                    ? "bg-forest-500 text-white shadow-soft"
                    : "bg-cream-50 text-forest-700 border border-cream-200 hover:bg-cream-100"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-cream-500 hidden sm:inline">
              排序方式:
            </span>
            <div className="flex items-center bg-cream-50 rounded-lg border border-cream-200 overflow-hidden">
              {sortOptions.map((option, idx) => (
                <button
                  key={option.key}
                  onClick={() => setSortBy(option.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all duration-200",
                    idx > 0 && "border-l border-cream-200",
                    sortBy === option.key
                      ? "bg-white text-forest-700 shadow-soft"
                      : "text-cream-500 hover:bg-cream-100"
                  )}
                >
                  <option.icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-2 border-t border-cream-100">
          <span className="text-cream-500">
            共找到{" "}
            <span className="font-semibold text-forest-700">
              {filteredRooms.length}
            </span>{" "}
            个自习室
          </span>
          {rooms.length > 0 && (
            <span className="text-cream-500">
              总座位{" "}
              <span className="font-semibold text-forest-700">
                {rooms.reduce((sum, r) => sum + r.capacity, 0)}
              </span>{" "}
              个
            </span>
          )}
        </div>
      </div>

      {loading.rooms ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      ) : filteredRooms.length === 0 ? (
        <div className="card p-12">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-cream-100 flex items-center justify-center">
              <Search className="w-10 h-10 text-cream-400" />
            </div>
            <div className="space-y-2">
              <h3 className="title-serif text-xl">没有找到匹配的自习室</h3>
              <p className="text-cream-500">试试调整筛选条件，或清除搜索关键词</p>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setOnlyAvailable(false);
              }}
              className="btn-primary"
            >
              重置筛选
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
