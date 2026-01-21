"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAdminStore, User, Permissions } from "@/lib/store/useAdminStore";
import {
  getSubadmins,
  createSubadmin,
  updateSubadminPermissions,
  deleteSubadmin,
  getAvailablePermissions,
  getUsers,
} from "@/lib/action/admin.action";
import { useToast } from "@/components/ui/Toast";
import {
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  Shield,
  Key,
} from "lucide-react";

interface CreateSubadminModalProps {
  onClose: () => void;
  onCreate: (data: { userName: string; permissions: string[] }) => Promise<{
    credentials?: { accountId: string; recoveryPassword: string };
  } | null>;
  permissions: Permissions | null;
}

function CreateSubadminModal({ onClose, onCreate, permissions }: CreateSubadminModalProps) {
  const [userName, setUserName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{
    accountId: string;
    recoveryPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    setLoading(true);
    const result = await onCreate({ userName, permissions: selectedPermissions });
    setLoading(false);

    if (result?.credentials) {
      setCredentials(result.credentials);
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const selectGroup = (groupPermissions: string[]) => {
    setSelectedPermissions((prev) => {
      const allSelected = groupPermissions.every((p) => prev.includes(p));
      if (allSelected) {
        return prev.filter((p) => !groupPermissions.includes(p));
      }
      return [...new Set([...prev, ...groupPermissions])];
    });
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (credentials) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl w-full max-w-lg">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Check className="text-green-400" size={20} />
              Subadmin Created
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-400 text-sm font-medium">
                Save these credentials! The recovery password will not be shown again.
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Account ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={credentials.accountId}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(credentials.accountId, "accountId")}
                  className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  {copied === "accountId" ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Recovery Password (24 words)</label>
              <div className="flex gap-2">
                <textarea
                  value={credentials.recoveryPassword}
                  readOnly
                  rows={3}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm font-mono resize-none"
                />
                <button
                  onClick={() => copyToClipboard(credentials.recoveryPassword, "password")}
                  className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 self-start"
                >
                  {copied === "password" ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Create Subadmin</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username *</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter username"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Permissions</label>

              {/* Permission Groups */}
              {permissions?.groups && (
                <div className="space-y-3 mb-4">
                  <p className="text-xs text-gray-500">Quick Select Groups:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(permissions.groups).map(([groupName, groupPerms]) => (
                      <button
                        key={groupName}
                        type="button"
                        onClick={() => selectGroup(groupPerms)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          groupPerms.every((p) => selectedPermissions.includes(p))
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {groupName.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Permissions */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {permissions?.permissions &&
                  Object.entries(permissions.permissions).map(([key, value]) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(value)}
                        onChange={() => togglePermission(value)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">
                        {key.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !userName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Subadmin"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditPermissionsModalProps {
  subadmin: User;
  onClose: () => void;
  onSave: (subadminId: string, permissions: string[]) => Promise<void>;
  permissions: Permissions | null;
}

function EditPermissionsModal({
  subadmin,
  onClose,
  onSave,
  permissions,
}: EditPermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    subadmin.permissions || []
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(subadmin._id, selectedPermissions);
    setLoading(false);
    onClose();
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            Edit Permissions - {subadmin.userName}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {permissions?.permissions &&
              Object.entries(permissions.permissions).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(value)}
                    onChange={() => togglePermission(value)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">
                    {key.replace(/_/g, " ").toLowerCase()}
                  </span>
                </label>
              ))}
          </div>
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-3">
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
                {loading ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubadminsPage() {
  const { accessToken, user: currentUser } = useAuthStore();
  const {
    subadmins,
    subadminsPagination,
    subadminsLoading,
    availablePermissions,
    setSubadmins,
    setSubadminsLoading,
    updateSubadminInList,
    removeSubadminFromList,
    setAvailablePermissions,
  } = useAdminStore();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubadmin, setEditingSubadmin] = useState<User | null>(null);
  const [deletingSubadmin, setDeletingSubadmin] = useState<User | null>(null);

  const fetchSubadmins = useCallback(async () => {
    if (!accessToken) return;

    setSubadminsLoading(true);
    const response = await getSubadmins(accessToken, page);

    if (response.success && response.data) {
      const data = response.data as { subadmins: User[]; pagination: any };
      setSubadmins(data.subadmins, data.pagination);
    } else {
      showToast(response.error?.message || "Failed to load subadmins", "error");
    }
    setSubadminsLoading(false);
  }, [accessToken, page]);

  const fetchPermissions = useCallback(async () => {
    if (!accessToken || availablePermissions) return;

    const response = await getAvailablePermissions(accessToken);
    if (response.success && response.data) {
      setAvailablePermissions(response.data as Permissions);
    }
  }, [accessToken, availablePermissions]);

  useEffect(() => {
    fetchSubadmins();
    fetchPermissions();
  }, [fetchSubadmins, fetchPermissions]);

  // Redirect non-admins
  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Only super admins can manage subadmins</p>
        </div>
      </div>
    );
  }

  const handleCreateSubadmin = async (data: { userName: string; permissions: string[] }) => {
    if (!accessToken) return null;

    const response = await createSubadmin(accessToken, data);
    if (response.success && response.data) {
      fetchSubadmins();
      showToast("Subadmin created successfully", "success");
      return response.data as { credentials: { accountId: string; recoveryPassword: string } };
    } else {
      showToast(response.error?.message || "Failed to create subadmin", "error");
      return null;
    }
  };

  const handleUpdatePermissions = async (subadminId: string, permissions: string[]) => {
    if (!accessToken) return;

    const response = await updateSubadminPermissions(accessToken, subadminId, permissions);
    if (response.success && response.data) {
      updateSubadminInList(response.data as User);
      showToast("Permissions updated successfully", "success");
    } else {
      showToast(response.error?.message || "Failed to update permissions", "error");
    }
  };

  const handleDeleteSubadmin = async (subadminId: string) => {
    if (!accessToken) return;

    const response = await deleteSubadmin(accessToken, subadminId);
    if (response.success) {
      removeSubadminFromList(subadminId);
      showToast("Subadmin deleted successfully", "success");
    } else {
      showToast(response.error?.message || "Failed to delete subadmin", "error");
    }
    setDeletingSubadmin(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Subadmin Management</h2>
          <p className="text-sm text-gray-400 mt-1">Create and manage subadmin accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Subadmin
        </button>
      </div>

      {/* Subadmins List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        {subadminsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : subadmins.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No subadmins yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 text-blue-400 hover:text-blue-300"
            >
              Create your first subadmin
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {subadmins.map((subadmin) => (
              <div key={subadmin._id} className="p-4 hover:bg-gray-700/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{subadmin.userName}</h3>
                      <p className="text-sm text-gray-400">
                        {subadmin.accountId?.slice(0, 20)}...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(subadmin.createdAt).toLocaleDateString()}
                        {subadmin.createdBy && ` by ${(subadmin.createdBy as any).userName || "Admin"}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingSubadmin(subadmin)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit Permissions"
                    >
                      <Key size={18} />
                    </button>
                    <button
                      onClick={() => setDeletingSubadmin(subadmin)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Subadmin"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Permissions */}
                {subadmin.permissions && subadmin.permissions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {subadmin.permissions.slice(0, 5).map((permission) => (
                      <span
                        key={permission}
                        className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded"
                      >
                        {permission.replace(/_/g, " ")}
                      </span>
                    ))}
                    {subadmin.permissions.length > 5 && (
                      <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">
                        +{subadmin.permissions.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {subadminsPagination && subadminsPagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Page {page} of {subadminsPagination.pages}
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
                disabled={page === subadminsPagination.pages}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateSubadminModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSubadmin}
          permissions={availablePermissions}
        />
      )}

      {/* Edit Permissions Modal */}
      {editingSubadmin && (
        <EditPermissionsModal
          subadmin={editingSubadmin}
          onClose={() => setEditingSubadmin(null)}
          onSave={handleUpdatePermissions}
          permissions={availablePermissions}
        />
      )}

      {/* Delete Confirmation */}
      {deletingSubadmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-sm p-5">
            <h3 className="text-lg font-semibold text-white">Delete Subadmin</h3>
            <p className="text-gray-400 mt-2">
              Are you sure you want to delete &quot;{deletingSubadmin.userName}&quot;? This action
              cannot be undone.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeletingSubadmin(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSubadmin(deletingSubadmin._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
