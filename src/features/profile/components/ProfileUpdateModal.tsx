/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import type { AccountUpdateRequest } from "../../../services/apiService";

interface ProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdate: (data: AccountUpdateRequest) => Promise<void>;
  updating: boolean;
}

export const ProfileUpdateModal = ({
  isOpen,
  onClose,
  user,
  onUpdate,
  updating,
}: ProfileUpdateModalProps) => {
  const [formData, setFormData] = useState({
    bio: user?.bio || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({
      bio: formData.bio || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-cyan w-[90%] max-w-md rounded-xl p-6 text-white shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Update Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/70">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              rows={3}
              className="w-full rounded-md border border-cyan-400/30 bg-black/20 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
              placeholder="Tell us about yourself..."
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-500/30 text-gray-300 hover:bg-gray-700/40"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updating}
              className="border-cyan-400/40 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {updating ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
