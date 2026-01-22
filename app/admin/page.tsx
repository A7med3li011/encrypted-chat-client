"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminStore } from "@/lib/store/useAdminStore";
import { useToast } from "@/components/ui/Toast";
import {
  getSystemStats,
  getUserGrowthStats,
  getMessageStats,
  getTopActiveUsers,
} from "@/lib/action/admin.action";
import {
  Users,
  MessageSquare,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  Shield,
  Copy,
  Check,
  Trash2,
} from "lucide-react";

// Copy button component
function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("Copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1 rounded hover:bg-gray-600 transition-colors ${className}`}
      title="Copy Account ID"
    >
      {copied ? (
        <Check size={14} className="text-green-400" />
      ) : (
        <Copy size={14} className="text-gray-400 hover:text-white" />
      )}
    </button>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  trend?: number;
  color?: string;
}

function StatCard({ title, value, icon, description, trend, color = "blue" }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-400">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div
          className={`p-2 sm:p-3 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}
        >
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <TrendingUp size={14} className={trend >= 0 ? "text-green-400" : "text-red-400"} />
          <span className={`text-sm ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
          <span className="text-xs text-gray-500">from last week</span>
        </div>
      )}
    </div>
  );
}

// Bar Chart Component
interface BarChartProps {
  data: { date: string; count: number }[];
  color?: string;
  label?: string;
}

function BarChart({ data, color = "blue", label = "count" }: BarChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const colorClass = color === "blue" ? "bg-blue-500" : "bg-green-500";
  const hoverClass = color === "blue" ? "hover:bg-blue-400" : "hover:bg-green-400";

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-gray-500">
        <span>{maxCount}</span>
        <span>{Math.round(maxCount / 2)}</span>
        <span>0</span>
      </div>

      {/* Chart */}
      <div className="ml-10 h-48">
        <div className="h-full flex items-end gap-1">
          {data.map((stat, index) => {
            const height = (stat.count / maxCount) * 100;
            return (
              <div
                key={stat.date || index}
                className="flex-1 flex flex-col items-center group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    <p className="font-medium">{new Date(stat.date).toLocaleDateString()}</p>
                    <p>{stat.count} {label}</p>
                  </div>
                </div>

                {/* Bar */}
                <div
                  className={`w-full ${colorClass} ${hoverClass} transition-colors rounded-t cursor-pointer`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-1 mt-2">
          {data.map((stat, index) => {
            const dateObj = new Date(stat.date);
            const dayLabel = dateObj.getDate();
            const showLabel = data.length <= 7 || index % Math.ceil(data.length / 7) === 0;
            return (
              <div key={stat.date || index} className="flex-1 text-center">
                <span className={`text-xs text-gray-500 ${showLabel ? "" : "hidden sm:inline"}`}>
                  {dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { accessToken } = useAuthStore();
  const {
    systemStats,
    userGrowthStats,
    messageStats,
    topActiveUsers,
    analyticsLoading,
    setSystemStats,
    setUserGrowthStats,
    setMessageStats,
    setTopActiveUsers,
    setAnalyticsLoading,
  } = useAdminStore();

  const [error, setError] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<7 | 14 | 30>(14);

  useEffect(() => {
    async function fetchData() {
      if (!accessToken) return;

      setAnalyticsLoading(true);
      setError(null);

      try {
        const [statsRes, growthRes, msgStatsRes, topUsersRes] = await Promise.all([
          getSystemStats(accessToken),
          getUserGrowthStats(accessToken, 30),
          getMessageStats(accessToken, 30),
          getTopActiveUsers(accessToken, 5),
        ]);

        if (statsRes.success && statsRes.data) {
          setSystemStats(statsRes.data as any);
        }
        if (growthRes.success && growthRes.data) {
          setUserGrowthStats(growthRes.data as any);
        }
        if (msgStatsRes.success && msgStatsRes.data) {
          setMessageStats(msgStatsRes.data as any);
        }
        if (topUsersRes.success && topUsersRes.data) {
          setTopActiveUsers(topUsersRes.data as any);
        }

        if (!statsRes.success) {
          setError(statsRes.error?.message || "Failed to load statistics");
        }
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setAnalyticsLoading(false);
      }
    }

    fetchData();
  }, [accessToken]);

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Filter data based on selected period
  const filteredGrowthStats = userGrowthStats.slice(-chartPeriod);
  const filteredMessageStats = messageStats.slice(-chartPeriod);

  // Calculate totals for the period
  const periodUserTotal = filteredGrowthStats.reduce((sum, s) => sum + s.count, 0);
  const periodMessageTotal = filteredMessageStats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h2>
        <p className="text-blue-100 mt-1 text-sm sm:text-base">
          Monitor your encrypted chat platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Users"
          value={systemStats?.users.total || 0}
          icon={<Users size={20} className="sm:w-6 sm:h-6" />}
          description={`${systemStats?.users.active || 0} active`}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={systemStats?.users.active || 0}
          icon={<UserCheck size={20} className="sm:w-6 sm:h-6" />}
          color="green"
        />
        <StatCard
          title="Inactive Users"
          value={systemStats?.users.inactive || 0}
          icon={<UserX size={20} className="sm:w-6 sm:h-6" />}
          color="red"
        />
        <StatCard
          title="Conversations"
          value={systemStats?.conversations.total || 0}
          icon={<MessageSquare size={20} className="sm:w-6 sm:h-6" />}
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Messages"
          value={systemStats?.messages.total || 0}
          icon={<Activity size={20} className="sm:w-6 sm:h-6" />}
          description={`${systemStats?.messages.thisWeek || 0} this week`}
          color="yellow"
        />
        <StatCard
          title="New Today"
          value={systemStats?.growth.newUsersToday || 0}
          icon={<TrendingUp size={20} className="sm:w-6 sm:h-6" />}
          color="green"
        />
        <StatCard
          title="New This Week"
          value={systemStats?.growth.newUsersThisWeek || 0}
          icon={<TrendingUp size={20} className="sm:w-6 sm:h-6" />}
          color="blue"
        />
        <StatCard
          title="Deleted Users"
          value={systemStats?.users.deleted || 0}
          icon={<Trash2 size={20} className="sm:w-6 sm:h-6" />}
          description={`${systemStats?.users.subadmins || 0} subadmins`}
          color="red"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* User Growth Chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">User Growth</h3>
              <p className="text-xs text-gray-500">{periodUserTotal} new users in period</p>
            </div>
            <div className="flex gap-1">
              {([7, 14, 30] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                    chartPeriod === period
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {period}d
                </button>
              ))}
            </div>
          </div>
          {filteredGrowthStats.length > 0 ? (
            <BarChart data={filteredGrowthStats} color="blue" label="users" />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No growth data available
            </div>
          )}
        </div>

        {/* Message Activity Chart */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Message Activity</h3>
              <p className="text-xs text-gray-500">{periodMessageTotal} messages in period</p>
            </div>
            <div className="flex gap-1">
              {([7, 14, 30] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                    chartPeriod === period
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {period}d
                </button>
              ))}
            </div>
          </div>
          {filteredMessageStats.length > 0 ? (
            <BarChart data={filteredMessageStats} color="green" label="messages" />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No message data available
            </div>
          )}
        </div>
      </div>

      {/* Top Active Users */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Top Active Users</h3>
        {topActiveUsers.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {topActiveUsers.map((user, index) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {user.userName || "Unknown"}
                    </p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-gray-400 font-mono truncate">
                        {user.accountId?.slice(0, 16)}...
                      </p>
                      <CopyButton text={user.accountId} />
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-semibold text-white">{user.messageCount}</p>
                  <p className="text-xs text-gray-400">msgs</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No user activity data available</p>
        )}
      </div>

      {/* Admin Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-white">{systemStats?.users.admins || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Subadmins</p>
              <p className="text-2xl font-bold text-white">{systemStats?.users.subadmins || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400">New This Month</p>
              <p className="text-2xl font-bold text-white">
                {systemStats?.growth.newUsersThisMonth || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
