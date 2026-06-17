import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number;
  color?: "forest" | "amberGold" | "purple" | "blue";
}

const colorMap = {
  forest: {
    gradient: "from-forest-500 to-forest-700",
    bg: "bg-forest-50",
    icon: "text-forest-600",
    trend: "text-forest-600",
  },
  amberGold: {
    gradient: "from-amberGold-400 to-amberGold-600",
    bg: "bg-amberGold-50",
    icon: "text-amberGold-500",
    trend: "text-amberGold-500",
  },
  purple: {
    gradient: "from-purple-500 to-purple-700",
    bg: "bg-purple-50",
    icon: "text-purple-600",
    trend: "text-purple-600",
  },
  blue: {
    gradient: "from-blue-500 to-blue-700",
    bg: "bg-blue-50",
    icon: "text-blue-600",
    trend: "text-blue-600",
  },
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "forest",
}: StatCardProps) {
  const colors = colorMap[color];
  const isPositiveTrend = trend !== undefined && trend >= 0;

  return (
    <div className="card card-hover p-5 relative overflow-hidden">
      <div
        className={cn(
          "absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl",
          colors.gradient
        )}
      />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              colors.bg
            )}
          >
            <Icon className={cn("w-6 h-6", colors.icon)} />
          </div>

          {trend !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isPositiveTrend ? colors.trend : "text-red-500"
              )}
            >
              {isPositiveTrend ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-cream-500">{label}</p>
          <p className="text-3xl font-bold text-forest-800 tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
