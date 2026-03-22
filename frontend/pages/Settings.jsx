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
  const { user, updateProfile, deleteAccount, logout } = useAuth();
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;
    setMessage(null);

    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
      };

      if (formData.newPassword) {
        updateData.current_password = formData.currentPassword;
        updateData.password = formData.newPassword;
      }

      await updateProfile(updateData);

      setMessage({ type: "success", text: "Profile updated" });

      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));
      setShowCurrentPassword(false);
      setShowNewPassword(false);

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      let errorText = "Update failed";
      if (err.errors) {
        errorText = Object.values(err.errors).flat()[0];
      } else if (err.message) {
        errorText = err.message;
      }

      setMessage({
        type: "error",
        text: errorText,
      });
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
    setTimeout(() => setModalVisible(true), 50);
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText === "DELETE") {
      try {
        await deleteAccount();
        navigate("/");
      } catch (err) {
        setMessage({ type: "error", text: "Failed to delete account" });
        setShowDeleteModal(false);
      }
    }
  };

  return (
    <>
      <div className="space-y-6 lg:space-y-8 animate-fade-in relative z-10">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-500 mt-1 text-sm lg:text-base transition-colors duration-500 ease-in-out">
            Manage your personal information.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors duration-500 ease-in-out ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20"
                : "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Update Profile Section */}
        <div className="bg-white dark:bg-surface p-5 lg:p-8 rounded-xl border border-slate-200 dark:border-border transition-colors duration-500 ease-in-out">
          <h2 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 transition-colors duration-500 ease-in-out">
            <User className="text-primary" size={20} />
            Update Profile
          </h2>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5 transition-colors duration-500 ease-in-out">
                  Username
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out"
                  />
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-500 ease-in-out"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5 transition-colors duration-500 ease-in-out">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out"
                  />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-500 ease-in-out"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-border mt-4 transition-colors duration-500 ease-in-out">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300 mb-4 flex items-center gap-2 transition-colors duration-500 ease-in-out">
                <Lock size={16} className="text-primary" />
                Change Password
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5 transition-colors duration-500 ease-in-out">
                    Current Password
                  </label>
                  <div className="relative">
                    <Key
                      size={16}
                      className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out"
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
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 duration-500 ease-in-out"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors duration-500 ease-in-out focus:outline-none"
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
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5 transition-colors duration-500 ease-in-out">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out"
                    />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 duration-500 ease-in-out"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors duration-500 ease-in-out focus:outline-none"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!isValid}
                className={`px-6 py-2.5 rounded-lg font-bold transition-all duration-500 ease-in-out flex items-center gap-2 ${
                  isValid
                    ? "bg-primary text-white hover:bg-blue-600 active:scale-95"
                    : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                <Save size={18} /> Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone Section */}
        <div className="bg-red-50 dark:bg-red-500/5 p-5 lg:p-8 rounded-xl border border-red-200 dark:border-red-500/10 transition-colors duration-500 ease-in-out">
          <h2 className="text-lg lg:text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Danger Zone
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 transition-colors duration-500 ease-in-out">
            Deleting your account cannot be undone. All data will be lost.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/20 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white px-6 py-2.5 rounded-lg font-bold transition-all duration-500 ease-in-out flex items-center gap-2"
          >
            <Trash2 size={18} /> Delete Account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div
          className={`fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 lg:pl-[var(--sidebar-width)] transition-all duration-500 ease-in-out ${
            modalVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`bg-white dark:bg-surface rounded-2xl border border-red-500/30 w-full max-w-md p-6 relative z-[80] transition-colors duration-500 transform ${
              modalVisible
                ? "scale-100 opacity-100 translate-y-0"
                : "scale-95 opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                  <AlertTriangle className="text-red-500" size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Account</h3>
              </div>
              <button
                onClick={() => {
                  setModalVisible(false);
                  setTimeout(() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }, 500);
                }}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors duration-500 ease-in-out"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-500 rounded-lg text-xs flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
              <p>
                This action <span className="font-bold">cannot be undone</span>.
                All data will be permanently deleted.
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
                  <span className="text-slate-900 bg-slate-200 dark:text-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono normal-case">
                    DELETE
                  </span>{" "}
                  to confirm
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 duration-500 ease-in-out"
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
                    setModalVisible(false);
                    setTimeout(() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText("");
                    }, 500);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-border text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors duration-500 ease-in-out"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmText !== "DELETE"}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    deleteConfirmText === "DELETE"
                      ? "bg-red-500 text-white hover:bg-red-600 active:scale-95"
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
    </>
  );
}
export default Settings;
