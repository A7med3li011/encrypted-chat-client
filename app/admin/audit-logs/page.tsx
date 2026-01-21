"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminStore, AuditLog } from "@/lib/store/useAdminStore";
import { getAuditLogs } from "@/lib/action/admin.action";
import { useToast } from "@/components/ui/Toast";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  User,
  Globe,
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
} from "lucide-react";

const actionColors: Record<string, string> = {
  USER_REGISTER: "bg-green-500/20 text-green-400",
  USER_LOGIN: "bg-blue-500/20 text-blue-400",
  USER_LOGOUT: "bg-gray-500/20 text-gray-400",
  USER_UPDATE: "bg-yellow-500/20 text-yellow-400",
  USER_DELETE: "bg-red-500/20 text-red-400",
  AUTH_FAILED: "bg-red-500/20 text-red-400",
  ACCESS_DENIED: "bg-red-500/20 text-red-400",
  ADMIN_LOGIN: "bg-purple-500/20 text-purple-400",
  ADMIN_VIEW_USERS: "bg-blue-500/20 text-blue-400",
  ADMIN_UPDATE_USER: "bg-yellow-500/20 text-yellow-400",
  ADMIN_DELETE_USER: "bg-red-500/20 text-red-400",
  SUBADMIN_CREATED: "bg-purple-500/20 text-purple-400",
  SUBADMIN_DELETED: "bg-red-500/20 text-red-400",
};

const severityIcons: Record<string, React.ReactNode> = {
  info: <Info size={16} className="text-blue-400" />,
  warning: <AlertTriangle size={16} className="text-yellow-400" />,
  error: <AlertCircle size={16} className="text-red-400" />,
  critical: <XCircle size={16} className="text-red-500" />,
};

const severityColors: Record<string, string> = {
  info: "bg-blue-500/10 border-blue-500/20",
  warning: "bg-yellow-500/10 border-yellow-500/20",
  error: "bg-red-500/10 border-red-500/20",
  critical: "bg-red-600/10 border-red-600/20",
};

interface LogDetailModalProps {
  log: AuditLog;
  onClose: () => void;
}

function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Log Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XCircle size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Action</label>
              <p className="text-white font-medium">{log.action}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Severity</label>
              <p className="text-white capitalize">{log.severity}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Resource Type</label>
              <p className="text-white">{log.resourceType || "-"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Resource ID</label>
              <p className="text-white font-mono text-sm">{log.resourceId || "-"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Method</label>
              <p className="text-white">{log.method || "-"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Status Code</label>
              <p className="text-white">{log.statusCode || "-"}</p>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Description</label>
            <p className="text-white mt-1">{log.description}</p>
          </div>

          <div>
            <label className="text-xs text-gray-500">Endpoint</label>
            <p className="text-white font-mono text-sm mt-1">{log.endpoint || "-"}</p>
          </div>

          <div>
            <label className="text-xs text-gray-500">IP Address</label>
            <p className="text-white font-mono text-sm mt-1">{log.ipAddress || "-"}</p>
          </div>

          <div>
            <label className="text-xs text-gray-500">User Agent</label>
            <p className="text-white text-sm mt-1 break-all">{log.userAgent || "-"}</p>
          </div>

          <div>
            <label className="text-xs text-gray-500">Timestamp</label>
            <p className="text-white mt-1">{new Date(log.createdAt).toLocaleString()}</p>
          </div>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <label className="text-xs text-gray-500">Metadata</label>
              <pre className="bg-gray-900 rounded-lg p-3 mt-1 text-sm text-gray-300 overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const { accessToken } = useAuthStore();
  const {
    auditLogs,
    auditLogsPagination,
    auditLogsLoading,
    setAuditLogs,
    setAuditLogsLoading,
  } = useAdminStore();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [actionFilter, setActionFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!accessToken) return;

    setAuditLogsLoading(true);
    const response = await getAuditLogs(accessToken, {
      page,
      limit: 25,
      action: actionFilter || undefined,
      severity: severityFilter || undefined,
    });

    if (response.success && response.data) {
      const data = response.data as { logs: AuditLog[]; pagination: any };
      // Handle different response structures
      if (Array.isArray(response.data)) {
        setAuditLogs(response.data as AuditLog[], { page, limit: 25, total: (response.data as AuditLog[]).length, pages: 1 });
      } else {
        setAuditLogs(data.logs || [], data.pagination || { page, limit: 25, total: 0, pages: 1 });
      }
    } else {
      showToast(response.error?.message || "Failed to load audit logs", "error");
    }
    setAuditLogsLoading(false);
  }, [accessToken, page, actionFilter, severityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actions = [
    "USER_REGISTER",
    "USER_LOGIN",
    "USER_LOGOUT",
    "USER_UPDATE",
    "USER_DELETE",
    "AUTH_FAILED",
    "ACCESS_DENIED",
    "ADMIN_LOGIN",
    "ADMIN_VIEW_USERS",
    "ADMIN_UPDATE_USER",
    "ADMIN_DELETE_USER",
    "ADMIN_ACTIVATE_USER",
    "ADMIN_DEACTIVATE_USER",
    "SUBADMIN_CREATED",
    "SUBADMIN_DELETED",
    "SUBADMIN_PERMISSIONS_CHANGED",
    "USER_ROLE_CHANGED",
  ];

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Audit Logs</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-700">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
            <button
              onClick={() => {
                setActionFilter("");
                setSeverityFilter("");
                setPage(1);
              }}
              className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Logs List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        {auditLogsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No audit logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {auditLogs.map((log) => (
              <div
                key={log._id}
                onClick={() => setSelectedLog(log)}
                className={`p-4 hover:bg-gray-700/30 cursor-pointer border-l-4 ${
                  severityColors[log.severity] || severityColors.info
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {severityIcons[log.severity]}
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          actionColors[log.action] || "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-gray-500">{log.resourceType}</span>
                    </div>
                    <p className="text-sm text-white mt-2">{log.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {log.userId && (
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {typeof log.userId === "object"
                            ? (log.userId as any).userName || "Unknown"
                            : "User"}
                        </span>
                      )}
                      {log.ipAddress && (
                        <span className="flex items-center gap-1">
                          <Globe size={12} />
                          {log.ipAddress}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {log.method && log.statusCode && (
                    <div className="text-right">
                      <span
                        className={`text-xs font-mono px-2 py-1 rounded ${
                          log.statusCode >= 400
                            ? "bg-red-500/20 text-red-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {log.method} {log.statusCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {auditLogsPagination && auditLogsPagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Page {page} of {auditLogsPagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === auditLogsPagination.pages}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
