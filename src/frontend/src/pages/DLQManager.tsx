import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { DLQItem, TaskDelivery } from '../types';
import { DeliveryDetailModal } from '../components/DeliveryDetailModal';
import {
  AlertTriangle,
  RefreshCw,
  Eye,
  Trash2,
  Filter,
  CheckCircle2,
  AlertOctagon,
  Flame,
} from 'lucide-react';

export const DLQManager: React.FC = () => {
  const [dlqItems, setDlqItems] = useState<DLQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedErrorCategory, setSelectedErrorCategory] = useState<string>('ALL');

  // Active retrying items state
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Selected delivery detail for modal
  const [selectedDelivery, setSelectedDelivery] = useState<TaskDelivery | null>(null);

  const fetchDLQ = async () => {
    setLoading(true);
    try {
      const items = await apiService.getDLQJobs();
      setDlqItems(items);
    } catch (err) {
      console.error('Failed to fetch DLQ items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDLQ();
  }, []);

  const handleRetryItem = async (item: DLQItem) => {
    setRetryingId(item.id);
    setActionNotice(null);
    try {
      const res = await apiService.retryDelivery(item.deliveryId);
      setActionNotice(`DLQ item ${item.deliveryId.slice(0, 8)}... successfully re-enqueued to worker queue.`);
      fetchDLQ();
    } catch (err: any) {
      setActionNotice('Failed to retry item: ' + (err.message || 'Unknown error'));
    } finally {
      setRetryingId(null);
    }
  };

  const handleDeleteItem = (id: string) => {
    setDlqItems(prev => prev.filter(item => item.id !== id));
    setActionNotice(`DLQ item purged from Dead Letter Queue storage.`);
  };

  const filteredItems = dlqItems.filter(item => {
    if (selectedErrorCategory === 'ALL') return true;
    return item.errorCategory === selectedErrorCategory;
  });

  const categories = Array.from(new Set(dlqItems.map(i => i.errorCategory).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2.5 text-rose-400" />
            Dead Letter Queue (DLQ) Manager
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Monitor terminal payload failures, inspect stack trace diagnostics, and execute manual re-enqueue operations.
          </p>
        </div>
        <button
          onClick={fetchDLQ}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Reload DLQ Backlog
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-4 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2.5 text-indigo-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Category Filter & Metrics Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-semibold text-slate-400 uppercase tracking-wider">Filter Error Reason:</span>
          <div className="relative">
            <select
              value={selectedErrorCategory}
              onChange={(e) => setSelectedErrorCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium appearance-none pr-8"
            >
              <option value="ALL">All Categories ({dlqItems.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80 flex items-center">
            <Flame className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
            {dlqItems.length} Terminal Failures
          </span>
        </div>
      </div>

      {/* DLQ Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-3 text-indigo-400" />
          <span className="font-medium text-sm">Inspecting DLQ Backlog...</span>
        </div>
      ) : !filteredItems.length ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-200 font-bold text-base">Dead Letter Queue is Clean!</p>
          <p className="text-slate-500 text-xs mt-1">There are no failed jobs in the DLQ requiring manual intervention.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Delivery / Task ID</th>
                  <th className="px-6 py-4">Target Email</th>
                  <th className="px-6 py-4">Failure Reason</th>
                  <th className="px-6 py-4 text-center">Retries</th>
                  <th className="px-6 py-4">Failed At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">
                      <div className="text-rose-400 font-bold">{item.deliveryId.slice(0, 18)}...</div>
                      <div className="text-slate-500 text-[10px]">{item.taskResultId.slice(0, 18)}...</div>
                    </td>
                    <td className="px-6 py-4 text-slate-200 text-xs">{item.emailId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-2 text-rose-300 text-xs max-w-md">
                        <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                        <span className="line-clamp-2 leading-relaxed">{item.reason}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        {item.retryCount} Max
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(item.lastAttemptAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() =>
                            setSelectedDelivery({
                              id: item.deliveryId,
                              taskResultId: item.taskResultId,
                              emailId: item.emailId,
                              destinationId: 'dest-webhook-01',
                              destinationName: 'Webhook API Target',
                              status: 'FAILED_DLQ',
                              attemptCount: item.retryCount,
                              lastError: item.reason + (item.errorStack ? '\n\n' + item.errorStack : ''),
                              createdAt: item.createdAt,
                              updatedAt: item.lastAttemptAt,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                          title="Inspect Error Stack"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRetryItem(item)}
                          disabled={retryingId === item.id}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${retryingId === item.id ? 'animate-spin' : ''}`} />
                          Retry
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-950 transition-colors border border-transparent hover:border-rose-800"
                          title="Purge Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Lineage Modal */}
      <DeliveryDetailModal
        delivery={selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        onRetrySuccess={fetchDLQ}
      />
    </div>
  );
};
