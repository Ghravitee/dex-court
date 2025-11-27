// src/pages/AdminAnalytics.tsx
import { BarChart3, Users, FileText, Scale } from "lucide-react";

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white/90">
          Analytics Dashboard
        </h1>
        <p className="mt-2 text-white/60">
          Platform statistics and performance metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/20 p-2">
              <Users className="size-5 text-blue-300" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white/90">0</div>
              <div className="text-sm text-white/60">Total Users</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/20 p-2">
              <FileText className="size-5 text-green-300" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white/90">0</div>
              <div className="text-sm text-white/60">Agreements</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/20 p-2">
              <Scale className="size-5 text-orange-300" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white/90">0</div>
              <div className="text-sm text-white/60">Disputes</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/20 p-2">
              <BarChart3 className="size-5 text-purple-300" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white/90">100%</div>
              <div className="text-sm text-white/60">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white/90">
            User Growth
          </h3>
          <div className="flex h-64 items-center justify-center">
            <div className="text-center text-white/60">
              <BarChart3 className="mx-auto mb-2 size-12" />
              <p>User growth charts coming soon</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white/90">
            Platform Activity
          </h3>
          <div className="flex h-64 items-center justify-center">
            <div className="text-center text-white/60">
              <BarChart3 className="mx-auto mb-2 size-12" />
              <p>Activity metrics coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
