import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Save,
  User,
  Mail,
  Lock,
  Trash2,
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { storageService } from "../services/storageService";
import { useNavigate } from "react-router-dom";

function Settings() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.username,
        email: user.email,
      }));
    }
  }, [user]);

  const hasChanges =
    user &&
    (formData.username !== user.username ||
      formData.email !== user.email ||
      formData.newPassword.length > 0);

  const isValid =
    hasChanges &&
    (formData.newPassword.length === 0 || formData.currentPassword.length > 0);

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!user) return;
    setMessage(null);

    let finalPassword = user.passwordHash;
    if (formData.newPassword) {
      if (formData.currentPassword !== user.passwordHash) {
        setMessage({ type: "error", text: "Current password is incorrect" });
        return;
      }
      finalPassword = formData.newPassword;
    }

    try {
      const allUsers = storageService.users.getAll();
      const updatedUser = {
        ...user,
        username: formData.username,
        email: formData.email,
        passwordHash: finalPassword,
      };

      const otherUsers = allUsers.filter((u) => u.id !== user.id);
      localStorage.setItem(
        "codeguard_users",
        JSON.stringify([...otherUsers, updatedUser])
      );

      login(updatedUser);
      setMessage({ type: "success", text: "Profile updated successfully" });

      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));
      setShowCurrentPassword(false);
      setShowNewPassword(false);

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile" });
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    if (deleteConfirmText === "DELETE") {
      const allUsers = storageService.users
        .getAll()
        .filter((u) => u.id !== user?.id);
      localStorage.setItem("codeguard_users", JSON.stringify(allUsers));
      logout();
      navigate("/");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">
          Manage your personal information.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-red-500/10 text-red-500 border-red-500/20"
          }`}
        >
          {message.text}
        </div>
      )}

      {}
      <div className="bg-surface p-5 md:p-8 rounded-xl border border-border">
        <h2 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2">
          <User className="text-primary" size={20} />
          Update Profile
        </h2>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-3 text-slate-500"
                />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-3 text-slate-500"
                />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Lock size={16} className="text-primary" />
              Change Password
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Key
                    size={16}
                    className="absolute left-3 top-3 text-slate-500"
                  />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors focus:outline-none"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-3 text-slate-500"
                  />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-background border border-border rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!isValid}
              className={`px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 ${
                isValid
                  ? "bg-primary text-white hover:bg-blue-600 shadow-blue-900/20 active:scale-95"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
              }`}
            >
              <Save size={18} /> Save Changes
            </button>
          </div>
        </form>
      </div>

      {}
      <div className="bg-red-500/5 p-5 md:p-8 rounded-xl border border-red-500/10">
        <h2 className="text-lg md:text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} />
          Danger Zone
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2"
        >
          <Trash2 size={18} /> Delete Account
        </button>
      </div>

      {}
      {showDeleteModal && (
        <div className="fixed inset-0 md:left-72 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl border border-red-500/30 w-full max-w-md p-6 shadow-2xl relative z-[80]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                  <AlertTriangle className="text-red-500" size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Delete Account</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
              <p>
                This action <span className="font-bold">cannot be undone</span>.
                All your projects, files, and scan history will be permanently
                deleted.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                confirmDeleteAccount();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Type{" "}
                  <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-mono normal-case">
                    DELETE
                  </span>{" "}
                  to confirm
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                  placeholder="Type DELETE here"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-6 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="flex-1 px-4 py-3 border border-border text-slate-400 rounded-xl font-bold hover:bg-white/5 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmText !== "DELETE"}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    deleteConfirmText === "DELETE"
                      ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-900/20 active:scale-95"
                      : "bg-red-500/20 text-red-500/50 cursor-not-allowed"
                  }`}
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
