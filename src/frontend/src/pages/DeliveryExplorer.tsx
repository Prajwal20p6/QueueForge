import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { TaskDelivery } from '../types';
import { DeliveryTable } from '../components/DeliveryTable';
import { DeliveryDetailModal } from '../components/DeliveryDetailModal';
import { Search, Filter, RefreshCw, XCircle } from 'lucide-react';

export const DeliveryExplorer: React.FC = () => {
  const [deliveries, setDeliveries] = useState<TaskDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [taskResultId, setTaskResultId] = useState('');
  const [emailId, setEmailId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Modal state
  const [selectedDelivery, setSelectedDelivery] = useState<TaskDelivery | null>(null);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const res = await apiService.getDeliveries({
        taskResultId: taskResultId.trim() || undefined,
        emailId: emailId.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setDeliveries(res.data);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDeliveries();
  };

  const handleResetFilters = () => {
    setTaskResultId('');
    setEmailId('');
    setStatusFilter('ALL');
    loadDeliveries();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Search className="w-6 h-6 mr-2.5 text-indigo-400" />
            Delivery Explorer & Trace Audit
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Search, filter, and inspect individual delivery dispatches across webhook and queue connectors.
          </p>
        </div>
        <button
          onClick={loadDeliveries}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Table
        </button>
      </div>

      {/* Filter Toolbar Card */}
      <form onSubmit={handleSearchSubmit} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Task Result ID Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Task Result ID
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. tr-551ce6b2..."
                value={taskResultId}
                onChange={(e) => setTaskResultId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
              />
            </div>
          </div>

          {/* Target Email Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Target Email ID
            </label>
            <input
              type="text"
              placeholder="e.g. devops@company.com"
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Execution Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors appearance-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">COMPLETED (Success)</option>
                <option value="FAILED_DLQ">FAILED_DLQ (Dead Letter)</option>
                <option value="SCHEDULED_RETRY">SCHEDULED_RETRY (Retrying)</option>
                <option value="PROCESSING">PROCESSING (Active)</option>
                <option value="PENDING">PENDING (Queued)</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end space-x-2">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Reset Filters"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Main Delivery Table */}
      <DeliveryTable
        deliveries={deliveries}
        onViewDetails={(del) => setSelectedDelivery(del)}
        loading={loading}
      />

      {/* Detail Lineage Modal */}
      <DeliveryDetailModal
        delivery={selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        onRetrySuccess={loadDeliveries}
      />
    </div>
  );
};
