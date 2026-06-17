import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Room, RoomType } from "@/../../shared/types";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  room: Room;
}

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

export default function RoomCard({ room }: RoomCardProps) {
  const typeInfo = roomTypeLabels[room.type];
  const occupancyRate = room.capacity > 0 ? (room.occupied / room.capacity) * 100 : 0;

  return (
    <div className="card card-hover overflow-hidden">
      <div className="relative h-36 flex items-center justify-center" style={{ backgroundColor: `${room.themeColor}15` }}>
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-soft"
          style={{ backgroundColor: room.themeColor }}
        >
          <span className="text-4xl">{room.icon}</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif font-semibold text-lg text-forest-800 leading-tight">
              {room.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span
                className={cn(
                  "chip border",
                  typeInfo.className
                )}
              >
                {typeInfo.label}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-cream-500">
            <span>座位使用</span>
            <span className="font-medium text-forest-700">
              {room.occupied} / {room.capacity}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-cream-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${occupancyRate}%`,
                backgroundColor:
                  occupancyRate >= 90
                    ? "#ef4444"
                    : occupancyRate >= 70
                    ? "#f59e0b"
                    : room.themeColor,
              }}
            />
          </div>
        </div>

        <p className="text-sm text-cream-500 line-clamp-2 min-h-[2.5rem]">
          {room.description}
        </p>

        <Link
          to={`/rooms/${room.id}`}
          className="btn-primary w-full"
        >
          进入自习室
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
