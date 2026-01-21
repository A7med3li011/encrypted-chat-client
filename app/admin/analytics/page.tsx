"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminStore } from "@/lib/store/useAdminStore";
import {
  getSystemStats,
  getUserGrowthStats,
  getMessageStats,
  getTopActiveUsers,
} from "@/lib/action/admin.action";
import {
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
  Calendar,
  BarChart3,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  color?: string;
}

function StatCard({ title, value, icon, description, color = "blue" }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

interface ChartBarProps {
  data: { date: string; count: number }[];
  maxValue: number;
  title: string;
  color?: string;
}

function SimpleBarChart({ data, maxValue, title, color = "blue" }: ChartBarProps) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/30 hover:bg-blue-500/50",
    green: "bg-green-500/30 hover:bg-green-500/50",
    purple: "bg-purple-500/30 hover:bg-purple-500/50",
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {data.length > 0 ? (
        <div className="space-y-4">
          <div className="h-48 flex items-end gap-1">
            {data.slice(-21).map((stat, index) => {
              const height = maxValue > 0 ? (stat.count / maxValue) * 100 : 0;
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`${stat.date}: ${stat.count}`}
                >
                  <div
                    className={`w-full rounded-t transition-colors ${colorClasses[color]}`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{data[Math.max(0, data.length - 21)]?.date}</span>
            <span>{data[data.length - 1]?.date}</span>
          </div>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
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

  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!accessToken) return;

      setAnalyticsLoading(true);
      setError(null);

      try {
        const [statsRes, growthRes, msgStatsRes, topUsersRes] = await Promise.all([
          getSystemStats(accessToken),
          getUserGrowthStats(accessToken, days),
          getMessageStats(accessToken, days),
          getTopActiveUsers(accessToken, 10),
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
          setError(statsRes.error?.message || "Failed to load analytics");
        }
      } catch (err) {
        setError("Failed to load analytics data");
      } finally {
        setAnalyticsLoading(false);
      }
    }

    fetchData();
  }, [accessToken, days]);

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

  const maxUserGrowth = Math.max(...userGrowthStats.map((s) => s.count), 1);
  const maxMessages = Math.max(...messageStats.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Analytics Overview</h2>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* User Stats */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users size={20} />
          User Statistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={systemStats?.users.total || 0}
            icon={<Users size={24} />}
            description={`${systemStats?.users.regularUsers || 0} regular users`}
            color="blue"
          />
          <StatCard
            title="Active Users"
            value={systemStats?.users.active || 0}
            icon={<Activity size={24} />}
            description={`${((systemStats?.users.active || 0) / (systemStats?.users.total || 1) * 100).toFixed(1)}% of total`}
            color="green"
          />
          <StatCard
            title="Admins"
            value={systemStats?.users.admins || 0}
            icon={<Users size={24} />}
            color="purple"
          />
          <StatCard
            title="Subadmins"
            value={systemStats?.users.subadmins || 0}
            icon={<Users size={24} />}
            color="purple"
          />
        </div>
      </div>

      {/* Growth Stats */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Growth Statistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="New Users Today"
            value={systemStats?.growth.newUsersToday || 0}
            icon={<TrendingUp size={24} />}
            color="green"
          />
          <StatCard
            title="New Users This Week"
            value={systemStats?.growth.newUsersThisWeek || 0}
            icon={<TrendingUp size={24} />}
            color="blue"
          />
          <StatCard
            title="New Users This Month"
            value={systemStats?.growth.newUsersThisMonth || 0}
            icon={<TrendingUp size={24} />}
            color="purple"
          />
        </div>
      </div>

      {/* Message Stats */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare size={20} />
          Message Statistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Messages"
            value={systemStats?.messages.total || 0}
            icon={<MessageSquare size={24} />}
            color="blue"
          />
          <StatCard
            title="Messages This Week"
            value={systemStats?.messages.thisWeek || 0}
            icon={<Activity size={24} />}
            color="green"
          />
          <StatCard
            title="Total Conversations"
            value={systemStats?.conversations.total || 0}
            icon={<MessageSquare size={24} />}
            color="purple"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          data={userGrowthStats}
          maxValue={maxUserGrowth}
          title={`User Growth (Last ${days} Days)`}
          color="blue"
        />
        <SimpleBarChart
          data={messageStats}
          maxValue={maxMessages}
          title={`Message Activity (Last ${days} Days)`}
          color="green"
        />
      </div>

      {/* Top Active Users */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Top 10 Active Users
        </h3>
        {topActiveUsers.length > 0 ? (
          <div className="space-y-3">
            {topActiveUsers.map((user, index) => {
              const maxMsgCount = topActiveUsers[0]?.messageCount || 1;
              const percentage = (user.messageCount / maxMsgCount) * 100;

              return (
                <div key={user._id} className="flex items-center gap-4">
                  <span className="w-6 h-6 flex items-center justify-center bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{user.userName}</span>
                      <span className="text-sm text-gray-400">{user.messageCount} messages</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No user activity data available</p>
        )}
      </div>
    </div>
  );
}
