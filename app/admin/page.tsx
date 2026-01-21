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
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  Shield,
} from "lucide-react";

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
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div
          className={`p-3 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}
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

export default function AdminDashboard() {
  const { accessToken } = useAuthStore();
  const {
    systemStats,
    userGrowthStats,
    topActiveUsers,
    analyticsLoading,
    setSystemStats,
    setUserGrowthStats,
    setMessageStats,
    setTopActiveUsers,
    setAnalyticsLoading,
  } = useAdminStore();

  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white">Welcome to Admin Dashboard</h2>
        <p className="text-blue-100 mt-1">
          Monitor your encrypted chat platform and manage users
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={systemStats?.users.total || 0}
          icon={<Users size={24} />}
          description={`${systemStats?.users.active || 0} active`}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={systemStats?.users.active || 0}
          icon={<UserCheck size={24} />}
          color="green"
        />
        <StatCard
          title="Inactive Users"
          value={systemStats?.users.inactive || 0}
          icon={<UserX size={24} />}
          color="red"
        />
        <StatCard
          title="Total Conversations"
          value={systemStats?.conversations.total || 0}
          icon={<MessageSquare size={24} />}
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Messages"
          value={systemStats?.messages.total || 0}
          icon={<Activity size={24} />}
          description={`${systemStats?.messages.thisWeek || 0} this week`}
          color="yellow"
        />
        <StatCard
          title="New Users Today"
          value={systemStats?.growth.newUsersToday || 0}
          icon={<TrendingUp size={24} />}
          color="green"
        />
        <StatCard
          title="New This Week"
          value={systemStats?.growth.newUsersThisWeek || 0}
          icon={<TrendingUp size={24} />}
          color="blue"
        />
        <StatCard
          title="Subadmins"
          value={systemStats?.users.subadmins || 0}
          icon={<Shield size={24} />}
          description={`${systemStats?.users.admins || 0} admins`}
          color="purple"
        />
      </div>

      {/* Top Active Users */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Top Active Users</h3>
        {topActiveUsers.length > 0 ? (
          <div className="space-y-3">
            {topActiveUsers.map((user, index) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{user.userName}</p>
                    <p className="text-xs text-gray-400">{user.accountId?.slice(0, 12)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{user.messageCount}</p>
                  <p className="text-xs text-gray-400">messages</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No user activity data available</p>
        )}
      </div>

      {/* User Growth Chart Placeholder */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-white mb-4">User Growth (Last 30 Days)</h3>
        {userGrowthStats.length > 0 ? (
          <div className="h-48 flex items-end gap-1">
            {userGrowthStats.slice(-14).map((stat, index) => {
              const maxCount = Math.max(...userGrowthStats.map((s) => s.count), 1);
              const height = (stat.count / maxCount) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 bg-blue-500/30 hover:bg-blue-500/50 transition-colors rounded-t"
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${stat.date}: ${stat.count} users`}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-12">No growth data available</p>
        )}
      </div>
    </div>
  );
}
