"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminStore, User } from "@/lib/store/useAdminStore";
import {
  getUsers,
  updateUser,
  deleteUser,
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
} from "lucide-react";

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
        <p className="text-gray-400 mt-2">{message}</p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
              confirmColor === "red"
                ? "bg-red-600 hover:bg-red-700"
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
  } = useAdminStore();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "activate" | "deactivate" | "promote" | "demote";
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
      setUsers(data.users, data.pagination);
    } else {
      showToast(response.error?.message || "Failed to load users", "error");
    }
    setUsersLoading(false);
  }, [accessToken, page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
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

  const handleDeleteUser = async (userId: string) => {
    if (!accessToken) return;

    const response = await deleteUser(accessToken, userId);
    if (response.success) {
      removeUserFromList(userId);
      showToast("User deleted successfully", "success");
    } else {
      showToast(response.error?.message || "Failed to delete user", "error");
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

  return (
    <div className="space-y-4">
      {/* Header with Search & Filters */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username or account ID..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-700">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
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
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                    Last Login
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                    Created
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
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
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.userName || "No username"}
                          </p>
                          <p className="text-xs text-gray-400">{user.accountId?.slice(0, 16)}...</p>
                        </div>
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
                          user.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.isActive ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
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
        )}

        {/* Pagination */}
        {usersPagination && usersPagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, usersPagination.total)} of{" "}
              {usersPagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="flex items-center px-3 text-sm text-gray-400">
                Page {page} of {usersPagination.pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === usersPagination.pages}
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
          message={`Are you sure you want to delete "${confirmAction.user.userName}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={() => handleDeleteUser(confirmAction.user._id)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {(confirmAction?.type === "activate" || confirmAction?.type === "deactivate") && (
        <ConfirmModal
          title={confirmAction.type === "activate" ? "Activate User" : "Deactivate User"}
          message={`Are you sure you want to ${confirmAction.type} "${confirmAction.user.userName}"?`}
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
          } "${confirmAction.user.userName}"?`}
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
