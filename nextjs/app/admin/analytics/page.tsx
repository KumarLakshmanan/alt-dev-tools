"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Eye,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  LogOut,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface AnalyticsData {
  total: number;
  days: number;
  byPage: { label: string; count: number }[];
  byCountry: { label: string; count: number }[];
  byDevice: { label: string; count: number }[];
  byReferrer: { label: string; count: number }[];
  byDay: { date: string; count: number }[];
  feedbacks: { reason: string; source: string; created_at: string }[];
}

// ─── Login Form ─────────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/analytics/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        sessionStorage.setItem("altdev_admin_token", data.token);
        onLogin(data.token);
      } else {
        setError(data.error ?? "Invalid credentials.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-sm p-8 rounded-2xl border border-[var(--border)] bg-white dark:bg-slate-900 shadow-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-64.png" alt="ALT-DEV TOOLS" className="w-10 h-10 rounded-xl" />
          <div>
            <div className="font-bold text-lg text-slate-800 dark:text-slate-100">ALT-DEV TOOLS</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Analytics Dashboard</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-brand-gradient text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white dark:bg-slate-900 p-5 flex gap-4 items-start shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-500 shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</div>
        {sub && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Mini Bar Chart ──────────────────────────────────────────────────────────

function BarList({ items, max }: { items: { label: string; count: number }[]; max: number }) {
  if (!items.length) return <p className="text-sm text-slate-400 py-4 text-center">No data yet.</p>;
  return (
    <ul className="space-y-2">
      {items.slice(0, 8).map((item) => (
        <li key={item.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 text-slate-600 dark:text-slate-400 truncate" title={item.label}>
            {item.label || "—"}
          </span>
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-brand-gradient"
              style={{ width: `${Math.round((item.count / max) * 100)}%` }}
            />
          </div>
          <span className="w-8 text-right font-semibold text-slate-700 dark:text-slate-300 shrink-0">
            {item.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─── Line Chart (SVG) ────────────────────────────────────────────────────────

function LineChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return <p className="text-sm text-slate-400 py-4 text-center">No data yet.</p>;

  const W = 600;
  const H = 120;
  const PAD = { top: 10, right: 10, bottom: 24, left: 28 };
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const step = (W - PAD.left - PAD.right) / (data.length - 1 || 1);

  const points = data.map((d, i) => ({
    x: PAD.left + i * step,
    y: PAD.top + (H - PAD.top - PAD.bottom) * (1 - d.count / maxVal),
    date: d.date,
    count: d.count,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = [
    `M ${points[0].x},${H - PAD.bottom}`,
    ...points.map((p) => `L ${p.x},${p.y}`),
    `L ${points[points.length - 1].x},${H - PAD.bottom}`,
    "Z",
  ].join(" ");

  // Show ~6 date labels
  const labelStep = Math.max(1, Math.floor(data.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaGrad)" />
      <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2" />
      {points.map(
        (p, i) =>
          i % labelStep === 0 && (
            <text
              key={p.date}
              x={p.x}
              y={H - 6}
              textAnchor="middle"
              fontSize="8"
              fill="#94a3b8"
            >
              {p.date.slice(5)}
            </text>
          )
      )}
    </svg>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/analytics/data?days=${days}`, {
        headers: { "x-admin-token": token },
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, days, onLogout]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deviceIcon = (d: string) => {
    if (d === "mobile") return <Smartphone size={14} />;
    if (d === "tablet") return <Tablet size={14} />;
    return <Monitor size={14} />;
  };

  const topDevice = data?.byDevice[0]?.label ?? "desktop";
  const topCountry = data?.byCountry[0]?.label ?? "—";
  const maxPage = data?.byPage[0]?.count ?? 1;
  const maxCountry = data?.byCountry[0]?.count ?? 1;
  const maxDevice = data?.byDevice[0]?.count ?? 1;
  const maxReferrer = data?.byReferrer[0]?.count ?? 1;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-white/90 dark:bg-[#0f1117]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-64.png" alt="" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              ALT-DEV TOOLS <span className="text-brand-500 font-normal">Analytics</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="text-sm border border-[var(--border)] rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={fetchData}
              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw size={32} className="animate-spin text-brand-500" />
          </div>
        ) : data ? (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<Eye size={20} />}
                label="Total Page Views"
                value={data.total.toLocaleString()}
                sub={`Last ${data.days} days`}
              />
              <StatCard
                icon={<Users size={20} />}
                label="Unique Pages"
                value={data.byPage.length}
                sub="Distinct URLs"
              />
              <StatCard
                icon={<Globe size={20} />}
                label="Top Country"
                value={topCountry || "—"}
                sub={data.byCountry[0] ? `${data.byCountry[0].count} visits` : "No data"}
              />
              <StatCard
                icon={deviceIcon(topDevice)}
                label="Top Device"
                value={topDevice}
                sub={data.byDevice[0] ? `${data.byDevice[0].count} visits` : "No data"}
              />
            </div>

            {/* Line Chart */}
            <div className="rounded-2xl border border-[var(--border)] bg-white dark:bg-slate-900 p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-brand-500" />
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">Daily Page Views</h2>
              </div>
              <LineChart data={data.byDay} />
            </div>

            {/* Grid: Pages + Countries + Devices + Referrers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Top Pages */}
              <div className="rounded-2xl border border-[var(--border)] bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Top Pages</h2>
                <BarList items={data.byPage} max={maxPage} />
              </div>

              {/* Countries */}
              <div className="rounded-2xl border border-[var(--border)] bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={16} className="text-brand-500" />
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">Countries</h2>
                </div>
                <BarList items={data.byCountry} max={maxCountry} />
              </div>

              {/* Devices */}
              <div className="rounded-2xl border border-[var(--border)] bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Devices</h2>
                <BarList items={data.byDevice} max={maxDevice} />
              </div>

              {/* Referrers */}
              <div className="rounded-2xl border border-[var(--border)] bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Top Referrers</h2>
                <BarList items={data.byReferrer} max={maxReferrer} />
              </div>
            </div>

            {/* Feedback Table */}
            {data.feedbacks.length > 0 && (
              <div className="rounded-2xl border border-[var(--border)] bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={16} className="text-brand-500" />
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                    Recent Feedback ({data.feedbacks.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left py-2 pr-4 font-semibold text-slate-600 dark:text-slate-400">Reason</th>
                        <th className="text-left py-2 pr-4 font-semibold text-slate-600 dark:text-slate-400">Source</th>
                        <th className="text-left py-2 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {data.feedbacks.slice(0, 20).map((fb, i) => (
                        <tr key={i} className="text-slate-700 dark:text-slate-300">
                          <td className="py-2 pr-4 max-w-xs truncate" title={fb.reason}>{fb.reason || "—"}</td>
                          <td className="py-2 pr-4">{fb.source}</td>
                          <td className="py-2 text-slate-400">
                            {new Date(fb.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Page Tracker (client component used in layout) ──────────────────────────

// ─── Main Admin Page ─────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [token, setToken] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("altdev_admin_token");
    if (saved) setToken(saved);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("altdev_admin_token");
    setToken(null);
  };

  if (!token) {
    return <LoginForm onLogin={setToken} />;
  }

  return <Dashboard token={token} onLogout={handleLogout} />;
}
