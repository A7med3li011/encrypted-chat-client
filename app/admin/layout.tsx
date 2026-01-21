"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  LayoutDashboard,
  Users,
  Shield,
  MessageSquare,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: <Users size={20} />,
    permission: "view_users",
  },
  {
    href: "/admin/subadmins",
    label: "Subadmins",
    icon: <Shield size={20} />,
    adminOnly: true,
  },
  {
    href: "/admin/conversations",
    label: "Conversations",
    icon: <MessageSquare size={20} />,
    permission: "view_conversations",
  },
  {
    href: "/admin/audit-logs",
    label: "Audit Logs",
    icon: <FileText size={20} />,
    permission: "view_audit_logs",
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: <BarChart3 size={20} />,
    permission: "view_analytics",
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check authentication and role
    const stored = localStorage.getItem("auth-storage");
    if (!stored) {
      router.push("/auth/login");
      return;
    }

    let auth;
    try {
      auth = JSON.parse(stored);
    } catch {
      router.push("/auth/login");
      return;
    }

    if (!auth?.state?.accessToken) {
      router.push("/auth/login");
      return;
    }

    // Check if user is admin or subadmin
    const userRole = auth?.state?.user?.role;
    if (userRole !== "admin" && userRole !== "subadmin") {
      router.push("/dashboard");
    }
  }, [mounted, router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  const hasPermission = (permission?: string, adminOnly?: boolean) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (adminOnly) return false;
    if (!permission) return true;
    // For subadmins, check specific permission
    // Note: permissions would need to be stored in user object
    return true; // Simplified - backend will handle actual permission check
  };

  const filteredNavItems = navItems.filter((item) =>
    hasPermission(item.permission, item.adminOnly)
  );

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Admin Panel</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.userName?.[0]?.toUpperCase() || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.userName || "Admin"}
                </p>
                <p className="text-xs text-gray-400 capitalize">{user?.role || "admin"}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  {isActive && <ChevronRight size={16} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Back to app & Logout */}
          <div className="px-3 py-4 border-t border-gray-700 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <ChevronRight size={20} className="rotate-180" />
              <span className="font-medium">Back to App</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-gray-800 border-b border-gray-700 px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold text-white">
              {filteredNavItems.find((item) => item.href === pathname)?.label || "Admin"}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
