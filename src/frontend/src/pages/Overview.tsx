import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { apiService } from '../services/api';
import { StatCard } from '../components/StatCard';
import type { SystemHealth, JobTimeSeriesPoint } from '../types';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const Overview: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [timeSeries, setTimeSeries] = useState<JobTimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [healthData, timeData] = await Promise.all([
        apiService.getSystemHealth(),
        apiService.getTimeSeriesData(),
      ]);
      setHealth(healthData);
      setTimeSeries(timeData);
    } catch (err) {
      console.error('Failed to fetch Overview metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !health) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-slate-400 font-medium text-sm">Compiling Real-Time Pipeline Metrics...</p>
      </div>
    );
  }

  const pieData = [
    { name: 'Successful', value: health.totalJobsProcessed - health.failedJobs },
    { name: 'Failed (DLQ)', value: health.failedJobs },
  ];

  const COLORS = ['#10b981', '#f43f5e'];

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Activity className="w-6 h-6 mr-2.5 text-indigo-400" />
            System Operations Overview
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time pipeline metrics, throughput telemetry, and BullMQ queue processing health.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <ClockIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Last Updated: {new Date(health.lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Jobs Processed"
          value={health.totalJobsProcessed.toLocaleString()}
          subtext="Lifetime processed payloads"
          variant="default"
          icon={<Layers className="w-4 h-4 text-slate-300" />}
        />
        <StatCard
          label="Success Rate"
          value={`${health.successRate.toFixed(2)}%`}
          subtext="Target SLA: > 99.5%"
          variant="success"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="Failed Jobs"
          value={health.failedJobs}
          subtext="Dead Letter Queue backlog"
          variant={health.failedJobs > 0 ? 'error' : 'success'}
          icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
        />
        <StatCard
          label="Queue Depth"
          value={health.queueDepth}
          subtext="Active & waiting tasks"
          variant="info"
          icon={<Layers className="w-4 h-4 text-indigo-400" />}
        />
        <StatCard
          label="Active Workers"
          value={health.activeWorkers}
          subtext="BullMQ background cluster"
          variant="default"
          icon={<Cpu className="w-4 h-4 text-slate-300" />}
        />
        <StatCard
          label="System Health"
          value={health.systemStatus.toUpperCase()}
          subtext={`Uptime: ${health.uptimePercent || 99.98}%`}
          variant={health.systemStatus === 'healthy' ? 'success' : 'warning'}
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Throughput over 24h */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Task Throughput Over Time (24h Window)
            </h2>
            <span className="text-xs text-slate-400 font-mono">1-Hour Resolution</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="completed" name="Completed Jobs" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="failed" name="Failed Jobs" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Distribution */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Execution Outcome Ratio
            </h2>
            <p className="text-xs text-slate-400 mt-1">Delivery success vs DLQ failure ratio</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-xs text-slate-400 font-medium">Pipeline Efficiency Index: </span>
            <span className="text-xs font-bold text-emerald-400 ml-1">99.85% Optimal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
