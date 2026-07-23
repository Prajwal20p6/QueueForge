import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { Worker } from '../types';
import { Server, RefreshCw, Cpu, Activity, Clock, ShieldCheck, Zap } from 'lucide-react';

export const WorkerMonitor: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const data = await apiService.getWorkers();
      setWorkers(data);
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Server className="w-6 h-6 mr-2.5 text-indigo-400" />
            Worker Engine Cluster Monitor
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time status, heartbeats, concurrency capacity, and job assignments for BullMQ worker daemons.
          </p>
        </div>
        <button
          onClick={fetchWorkers}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Poll Worker Cluster
        </button>
      </div>

      {/* Cluster Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Nodes</p>
            <p className="text-2xl font-black text-white mt-1">{workers.length} Nodes</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Healthy Workers</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {workers.filter(w => w.status === 'online').length} Online
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cluster Concurrency</p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {workers.reduce((acc, w) => acc + (w.concurrency || 10), 0)} Threads
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Processed</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">
              {workers.reduce((acc, w) => acc + w.processingCount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Workers Grid Cards */}
      {loading && !workers.length ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-3 text-indigo-400" />
          <span className="font-medium text-sm">Querying Worker Heartbeats...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workers.map((w) => (
            <div
              key={w.id}
              className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4 hover:border-slate-700 transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                    <Cpu className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{w.id}</h3>
                    <p className="text-[11px] font-mono text-slate-400">{w.hostname || 'localhost'}</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  ONLINE
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Processed</span>
                  <span className="text-lg font-extrabold text-white mt-1 block">{w.processingCount.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Uptime</span>
                  <span className="text-lg font-extrabold text-white mt-1 block">{formatUptime(w.uptime)}</span>
                </div>
              </div>

              {/* Current Job Assignment */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Current Active Job</span>
                {w.currentJob ? (
                  <p className="font-mono text-indigo-300 font-bold text-[11px] truncate">{w.currentJob}</p>
                ) : (
                  <p className="text-slate-500 italic text-[11px]">Idle (Awaiting Jobs in Queue)</p>
                )}
              </div>

              {/* Heartbeat Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Heartbeat
                </span>
                <span className="font-mono font-medium text-slate-300">
                  {new Date(w.lastHeartbeat).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
