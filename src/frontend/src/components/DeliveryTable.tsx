import React from 'react';
import type { TaskDelivery } from '../types';
import { Eye, CheckCircle2, AlertTriangle, Clock, RefreshCw, XCircle } from 'lucide-react';

interface DeliveryTableProps {
  deliveries: TaskDelivery[];
  onViewDetails: (delivery: TaskDelivery) => void;
  loading?: boolean;
}

export const DeliveryTable: React.FC<DeliveryTableProps> = ({ deliveries, onViewDetails, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-indigo-400" />
        <span className="font-medium text-sm">Loading delivery records...</span>
      </div>
    );
  }

  if (!deliveries.length) {
    return (
      <div className="text-center py-16 bg-slate-900/50 rounded-xl border border-slate-800">
        <AlertTriangle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-300 font-semibold">No delivery records found</p>
        <p className="text-slate-500 text-xs mt-1">Try adjusting your search criteria or filter options.</p>
      </div>
    );
  }

  const getStatusBadge = (status: TaskDelivery['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            COMPLETED
          </span>
        );
      case 'FAILED_DLQ':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/80">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            FAILED_DLQ
          </span>
        );
      case 'SCHEDULED_RETRY':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
            SCHEDULED_RETRY
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-400 border border-indigo-800/80">
            <Clock className="w-3.5 h-3.5 mr-1 animate-pulse" />
            PROCESSING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3.5 h-3.5 mr-1" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/80 text-xs uppercase font-semibold text-slate-400 tracking-wider">
            <tr>
              <th className="px-6 py-4">Delivery ID</th>
              <th className="px-6 py-4">Task Result ID</th>
              <th className="px-6 py-4">Target Email</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Attempts</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-medium">
            {deliveries.map((d) => (
              <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-indigo-300 font-semibold">
                  {d.id.slice(0, 18)}...
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                  {d.taskResultId.slice(0, 18)}...
                </td>
                <td className="px-6 py-4 text-slate-200">{d.emailId || 'user@example.com'}</td>
                <td className="px-6 py-4">{getStatusBadge(d.status)}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300">
                    {d.attemptCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">
                  {new Date(d.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onViewDetails(d)}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
