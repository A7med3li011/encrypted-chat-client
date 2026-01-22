"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminStore, User } from "@/lib/store/useAdminStore";
import {
  getUsers,
  updateUser,
  deleteUser,
  restoreUser,
  getDeletedUsers,
  activateUser,
  deactivateUser,
  changeUserRole,
} from "@/lib/action/admin.action";
import { useToast } from "@/components/ui/Toast";
import {
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  RotateCcw,
  Users,
  UserMinus,
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

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, data: { userName?: string; bio?: string }) => Promise<void>;
}

function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [userName, setUserName] = useState(user.userName || "");
  const [bio, setBio] = useState(user.bio || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(user._id, { userName, bio });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Edit User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Account ID</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg">
              <span className="text-gray-300 text-sm font-mono truncate flex-1">
                {user.accountId}
              </span>
              <CopyButton text={user.accountId} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  title,
  message,
  confirmText,
  confirmColor = "red",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-sm p-5">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-gray-400 mt-2 text-sm">{message}</p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors text-sm ${
              confirmColor === "red"
                ? "bg-red-600 hover:bg-red-700"
                : confirmColor === "green"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { accessToken, user: currentUser } = useAuthStore();
  const {
    users,
    usersPagination,
    usersLoading,
    setUsers,
    setUsersLoading,
    updateUserInList,
    removeUserFromList,
    deletedUsers,
    deletedUsersPagination,
    deletedUsersLoading,
    setDeletedUsers,
    setDeletedUsersLoading,
    removeDeletedUserFromList,
  } = useAdminStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "permanent-delete" | "activate" | "deactivate" | "promote" | "demote" | "restore";
    user: User;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;

    setUsersLoading(true);
    const response = await getUsers(accessToken, {
      page,
      limit: 20,
      search,
      role: roleFilter || undefined,
      isActive: statusFilter ? statusFilter === "active" : undefined,
    });

    if (response.success && response.data) {
      const data = response.data as { users: User[]; pagination: any };
      setUsers(data.users || [], data.pagination);
    } else {
      showToast(response.error?.message || "Failed to load users", "error");
    }
    setUsersLoading(false);
  }, [accessToken, page, search, roleFilter, statusFilter]);

  const fetchDeletedUsers = useCallback(async () => {
    if (!accessToken) return;

    setDeletedUsersLoading(true);
    const response = await getDeletedUsers(accessToken, {
      page: deletedPage,
      limit: 20,
      search,
    });

    if (response.success && response.data) {
      const data = response.data as { users: User[]; pagination: any };
      setDeletedUsers(data.users || [], data.pagination);
    } else {
      showToast(response.error?.message || "Failed to load deleted users", "error");
    }
    setDeletedUsersLoading(false);
  }, [accessToken, deletedPage, search]);

  useEffect(() => {
    if (activeTab === "active") {
      fetchUsers();
    } else {
      fetchDeletedUsers();
    }
  }, [activeTab, fetchUsers, fetchDeletedUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setDeletedPage(1);
    if (activeTab === "active") {
      fetchUsers();
    } else {
      fetchDeletedUsers();
    }
  };

  const handleUpdateUser = async (userId: string, data: { userName?: string; bio?: string }) => {
    if (!accessToken) return;

    const response = await updateUser(accessToken, userId, data);
    if (response.success && response.data) {
      updateUserInList(response.data as User);
      showToast("User updated successfully", "success");
    } else {
      showToast(response.error?.message || "Failed to update user", "error");
    }
  };

  const handleDeleteUser = async (userId: string, permanent: boolean = false) => {
    if (!accessToken) return;

    const response = await deleteUser(accessToken, userId, permanent);
    if (response.success) {
      if (permanent) {
        removeDeletedUserFromList(userId);
        showToast("User permanently deleted", "success");
      } else {
        removeUserFromList(userId);
        showToast("User moved to deleted", "success");
      }
    } else {
      showToast(response.error?.message || "Failed to delete user", "error");
    }
    setConfirmAction(null);
  };

  const handleRestoreUser = async (userId: string) => {
    if (!accessToken) return;

    const response = await restoreUser(accessToken, userId);
    if (response.success) {
      removeDeletedUserFromList(userId);
      showToast("User restored successfully", "success");
      fetchUsers();
    } else {
      showToast(response.error?.message || "Failed to restore user", "error");
    }
    setConfirmAction(null);
  };

  const handleToggleActive = async (user: User) => {
    if (!accessToken) return;

    const response = user.isActive
      ? await deactivateUser(accessToken, user._id)
      : await activateUser(accessToken, user._id);

    if (response.success && response.data) {
      updateUserInList(response.data as User);
      showToast(
        `User ${user.isActive ? "deactivated" : "activated"} successfully`,
        "success"
      );
    } else {
      showToast(response.error?.message || "Failed to update user status", "error");
    }
    setConfirmAction(null);
  };

  const handleChangeRole = async (user: User, newRole: "user" | "subadmin") => {
    if (!accessToken) return;

    const response = await changeUserRole(accessToken, user._id, newRole);
    if (response.success && response.data) {
      updateUserInList(response.data as User);
      showToast(`User role changed to ${newRole}`, "success");
    } else {
      showToast(response.error?.message || "Failed to change role", "error");
    }
    setConfirmAction(null);
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      subadmin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      user: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return styles[role as keyof typeof styles] || styles.user;
  };

  const currentUsers = activeTab === "active" ? users : deletedUsers;
  const currentPagination = activeTab === "active" ? usersPagination : deletedUsersPagination;
  const currentLoading = activeTab === "active" ? usersLoading : deletedUsersLoading;
  const currentPage = activeTab === "active" ? page : deletedPage;
  const setCurrentPage = activeTab === "active" ? setPage : setDeletedPage;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === "active"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          <Users size={18} />
          <span className="hidden sm:inline">Active Users</span>
          <span className="sm:hidden">Active</span>
        </button>
        <button
          onClick={() => setActiveTab("deleted")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === "deleted"
              ? "bg-red-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          <UserMinus size={18} />
          <span className="hidden sm:inline">Deleted Users</span>
          <span className="sm:hidden">Deleted</span>
        </button>
      </div>

      {/* Header with Search & Filters */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Search size={18} className="sm:hidden" />
              <span className="hidden sm:inline">Search</span>
            </button>
            {activeTab === "active" && (
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showFilters ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Filter size={18} />
                <span className="hidden sm:inline">Filters</span>
              </button>
            )}
          </form>

          {/* Filters */}
          {showFilters && activeTab === "active" && (
            <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-700">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="subadmin">Subadmin</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Users Table/Cards */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {currentLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : currentUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {activeTab === "active" ? "No users found" : "No deleted users"}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Account ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                      {activeTab === "active" ? "Last Login" : "Deleted At"}
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {currentUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                            {user.profilePic ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_SOCKET_URL}${user.profilePic}`}
                                alt={user.userName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-medium">
                                {user.userName?.[0]?.toUpperCase() || "?"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {user.userName || "No username"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono">
                            {user.accountId?.slice(0, 20)}...
                          </span>
                          <CopyButton text={user.accountId} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadge(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            activeTab === "deleted"
                              ? "bg-red-500/20 text-red-400"
                              : user.isActive
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              activeTab === "deleted"
                                ? "bg-red-400"
                                : user.isActive
                                ? "bg-green-400"
                                : "bg-yellow-400"
                            }`}
                          />
                          {activeTab === "deleted" ? "Deleted" : user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {activeTab === "active"
                          ? user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : "Never"
                          : user.deletedAt
                          ? new Date(user.deletedAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <div className="relative">
                            <button
                              onClick={() =>
                                setDropdownOpen(dropdownOpen === user._id ? null : user._id)
                              }
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <MoreVertical size={18} />
                            </button>
                            {dropdownOpen === user._id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setDropdownOpen(null)}
                                />
                                <div className="absolute right-0 mt-1 w-48 bg-gray-700 rounded-lg shadow-lg z-20 py-1">
                                  {activeTab === "active" ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setShowEditModal(true);
                                          setDropdownOpen(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white"
                                      >
                                        <Edit size={16} />
                                        Edit User
                                      </button>
                                      <button
                                        onClick={() => {
                                          setConfirmAction({
                                            type: user.isActive ? "deactivate" : "activate",
                                            user,
                                          });
                                          setDropdownOpen(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white"
                                      >
                                        {user.isActive ? (
                                          <>
                                            <UserX size={16} />
                                            Deactivate
                                          </>
                                        ) : (
                                          <>
                                            <UserCheck size={16} />
                                            Activate
                                          </>
                                        )}
                                      </button>
                                      {currentUser?.role === "admin" && user.role !== "admin" && (
                                        <button
                                          onClick={() => {
                                            setConfirmAction({
                                              type: user.role === "subadmin" ? "demote" : "promote",
                                              user,
                                            });
                                            setDropdownOpen(null);
                                          }}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white"
                                        >
                                          <Shield size={16} />
                                          {user.role === "subadmin"
                                            ? "Demote to User"
                                            : "Promote to Subadmin"}
                                        </button>
                                      )}
                                      {user.role !== "admin" && (
                                        <button
                                          onClick={() => {
                                            setConfirmAction({ type: "delete", user });
                                            setDropdownOpen(null);
                                          }}
                                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-600"
                                        >
                                          <Trash2 size={16} />
                                          Delete User
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => {
                                          setConfirmAction({ type: "restore", user });
                                          setDropdownOpen(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:bg-gray-600"
                                      >
                                        <RotateCcw size={16} />
                                        Restore User
                                      </button>
                                      <button
                                        onClick={() => {
                                          setConfirmAction({ type: "permanent-delete", user });
                                          setDropdownOpen(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-600"
                                      >
                                        <Trash2 size={16} />
                                        Delete Permanently
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-700">
              {currentUsers.map((user) => (
                <div key={user._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {user.profilePic ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SOCKET_URL}${user.profilePic}`}
                            alt={user.userName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-medium text-lg">
                            {user.userName?.[0]?.toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">
                          {user.userName || "No username"}
                        </p>
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-gray-400 font-mono truncate">
                            {user.accountId?.slice(0, 12)}...
                          </p>
                          <CopyButton text={user.accountId} />
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setDropdownOpen(dropdownOpen === user._id ? null : user._id)
                        }
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {dropdownOpen === user._id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setDropdownOpen(null)}
                          />
                          <div className="absolute right-0 mt-1 w-48 bg-gray-700 rounded-lg shadow-lg z-20 py-1">
                            {activeTab === "active" ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowEditModal(true);
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white"
                                >
                                  <Edit size={16} />
                                  Edit User
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmAction({
                                      type: user.isActive ? "deactivate" : "activate",
                                      user,
                                    });
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white"
                                >
                                  {user.isActive ? (
                                    <>
                                      <UserX size={16} />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck size={16} />
                                      Activate
                                    </>
                                  )}
                                </button>
                                {currentUser?.role === "admin" && user.role !== "admin" && (
                                  <button
                                    onClick={() => {
                                      setConfirmAction({
                                        type: user.role === "subadmin" ? "demote" : "promote",
                                        user,
                                      });
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white"
                                  >
                                    <Shield size={16} />
                                    {user.role === "subadmin"
                                      ? "Demote to User"
                                      : "Promote to Subadmin"}
                                  </button>
                                )}
                                {user.role !== "admin" && (
                                  <button
                                    onClick={() => {
                                      setConfirmAction({ type: "delete", user });
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-600"
                                  >
                                    <Trash2 size={16} />
                                    Delete User
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setConfirmAction({ type: "restore", user });
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:bg-gray-600"
                                >
                                  <RotateCcw size={16} />
                                  Restore User
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmAction({ type: "permanent-delete", user });
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-600"
                                >
                                  <Trash2 size={16} />
                                  Delete Permanently
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                        activeTab === "deleted"
                          ? "bg-red-500/20 text-red-400"
                          : user.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          activeTab === "deleted"
                            ? "bg-red-400"
                            : user.isActive
                            ? "bg-green-400"
                            : "bg-yellow-400"
                        }`}
                      />
                      {activeTab === "deleted" ? "Deleted" : user.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {activeTab === "active" ? "Login: " : "Deleted: "}
                      {activeTab === "active"
                        ? user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : "Never"
                        : user.deletedAt
                        ? new Date(user.deletedAt).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {currentPagination && currentPagination.pages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Showing {(currentPage - 1) * 20 + 1} to{" "}
              {Math.min(currentPage * 20, currentPagination.total)} of {currentPagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="flex items-center px-3 text-sm text-gray-400">
                {currentPage} / {currentPagination.pages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === currentPagination.pages}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSave={handleUpdateUser}
        />
      )}

      {/* Confirm Modals */}
      {confirmAction?.type === "delete" && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete "${confirmAction.user.userName || "this user"}"? The user can be restored later.`}
          confirmText="Delete"
          onConfirm={() => handleDeleteUser(confirmAction.user._id, false)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "permanent-delete" && (
        <ConfirmModal
          title="Permanently Delete User"
          message={`Are you sure you want to PERMANENTLY delete "${confirmAction.user.userName || "this user"}"? This action cannot be undone!`}
          confirmText="Delete Forever"
          onConfirm={() => handleDeleteUser(confirmAction.user._id, true)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === "restore" && (
        <ConfirmModal
          title="Restore User"
          message={`Are you sure you want to restore "${confirmAction.user.userName || "this user"}"?`}
          confirmText="Restore"
          confirmColor="green"
          onConfirm={() => handleRestoreUser(confirmAction.user._id)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {(confirmAction?.type === "activate" || confirmAction?.type === "deactivate") && (
        <ConfirmModal
          title={confirmAction.type === "activate" ? "Activate User" : "Deactivate User"}
          message={`Are you sure you want to ${confirmAction.type} "${confirmAction.user.userName || "this user"}"?`}
          confirmText={confirmAction.type === "activate" ? "Activate" : "Deactivate"}
          confirmColor={confirmAction.type === "activate" ? "blue" : "red"}
          onConfirm={() => handleToggleActive(confirmAction.user)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {(confirmAction?.type === "promote" || confirmAction?.type === "demote") && (
        <ConfirmModal
          title={confirmAction.type === "promote" ? "Promote to Subadmin" : "Demote to User"}
          message={`Are you sure you want to ${
            confirmAction.type === "promote" ? "promote" : "demote"
          } "${confirmAction.user.userName || "this user"}"?`}
          confirmText={confirmAction.type === "promote" ? "Promote" : "Demote"}
          confirmColor="blue"
          onConfirm={() =>
            handleChangeRole(
              confirmAction.user,
              confirmAction.type === "promote" ? "subadmin" : "user"
            )
          }
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
