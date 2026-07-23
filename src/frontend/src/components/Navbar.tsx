import React from 'react';
import { Layers, Activity, Search, AlertTriangle, Server, RefreshCw } from 'lucide-react';

export type PageId = 'overview' | 'deliveries' | 'dlq' | 'workers';

interface NavbarProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  systemStatus?: 'healthy' | 'degraded' | 'offline';
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onPageChange,
  systemStatus = 'healthy',
  onRefresh,
}) => {
  const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'System Overview', icon: <Activity className="w-4 h-4 mr-2" /> },
    { id: 'deliveries', label: 'Delivery Explorer', icon: <Search className="w-4 h-4 mr-2" /> },
    { id: 'dlq', label: 'DLQ Manager', icon: <AlertTriangle className="w-4 h-4 mr-2" /> },
    { id: 'workers', label: 'Worker Monitor', icon: <Server className="w-4 h-4 mr-2" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Header */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onPageChange('overview')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">QueueForge</span>
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                ADMIN OPS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currentPage === item.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Status Badge & Refresh */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${
              systemStatus === 'healthy' ? 'bg-emerald-500 animate-pulse' :
              systemStatus === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
            }`} />
            <span className="font-semibold text-slate-300 capitalize">{systemStatus}</span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-all border border-slate-700/60"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
