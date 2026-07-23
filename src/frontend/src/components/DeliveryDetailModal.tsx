import React, { useState } from 'react';
import type { TaskDelivery } from '../types';
import { apiService } from '../services/api';
import { X, RefreshCw, CheckCircle2, AlertOctagon, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

interface DeliveryDetailModalProps {
  delivery: TaskDelivery | null;
  onClose: () => void;
  onRetrySuccess?: () => void;
}

export const DeliveryDetailModal: React.FC<DeliveryDetailModalProps> = ({
  delivery,
  onClose,
  onRetrySuccess,
}) => {
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  if (!delivery) return null;

  const handleRetry = async () => {
    setRetrying(true);
    setRetryMessage(null);
    try {
      const res = await apiService.retryDelivery(delivery.id);
      setRetryMessage(res.message);
      if (onRetrySuccess) onRetrySuccess();
    } catch (err: any) {
      setRetryMessage('Failed to trigger retry request: ' + (err.message || 'Unknown error'));
    } finally {
      setRetrying(false);
    }
  };

  const getLineageStep = (step: string) => {
    const isCompleted = delivery.status === 'COMPLETED';
    const isFailed = delivery.status === 'FAILED_DLQ';

    if (step === 'created') return { done: true, color: 'bg-emerald-500 text-white' };
    if (step === 'queued') return { done: true, color: 'bg-emerald-500 text-white' };
    if (step === 'processing') return { done: delivery.attemptCount > 0, color: 'bg-emerald-500 text-white' };
    if (step === 'retry') {
      const hasRetries = delivery.attemptCount > 1;
      return { done: hasRetries, color: hasRetries ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400' };
    }
    if (step === 'final') {
      if (isCompleted) return { done: true, color: 'bg-emerald-500 text-white', text: 'Delivered' };
      if (isFailed) return { done: true, color: 'bg-rose-500 text-white', text: 'DLQ Failed' };
      return { done: false, color: 'bg-indigo-500 text-white', text: 'Pending' };
    }
    return { done: false, color: 'bg-slate-700 text-slate-400' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Delivery Record Lineage & Trace</h2>
              <p className="text-xs text-slate-400 font-mono">ID: {delivery.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status Alert Banner */}
          {retryMessage && (
            <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-indigo-400 shrink-0" />
              {retryMessage}
            </div>
          )}

          {/* Lineage Visualizer */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Delivery Lineage & Lifecycle
            </h3>
            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getLineageStep('created').color}`}>
                  1
                </div>
                <span className="text-[11px] font-semibold text-slate-300 mt-2">Created</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getLineageStep('queued').color}`}>
                  2
                </div>
                <span className="text-[11px] font-semibold text-slate-300 mt-2">Queued</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getLineageStep('processing').color}`}>
                  3
                </div>
                <span className="text-[11px] font-semibold text-slate-300 mt-2">Processing</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getLineageStep('retry').color}`}>
                  {delivery.attemptCount > 1 ? delivery.attemptCount - 1 : 0}
                </div>
                <span className="text-[11px] font-semibold text-slate-300 mt-2">Retries</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getLineageStep('final').color}`}>
                  ✓
                </div>
                <span className="text-[11px] font-semibold text-slate-300 mt-2">
                  {getLineageStep('final').text}
                </span>
              </div>
            </div>
          </div>

          {/* Details Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Task Result ID</span>
              <p className="font-mono text-indigo-300 font-bold break-all">{delivery.taskResultId}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Target Email ID</span>
              <p className="text-slate-100 font-bold">{delivery.emailId || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Destination Connector</span>
              <p className="text-slate-100 font-bold">{delivery.destinationName || delivery.destinationId}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Total Attempts</span>
              <p className="text-slate-100 font-bold">{delivery.attemptCount} Attempt(s)</p>
            </div>
          </div>

          {/* Error Trace if available */}
          {delivery.lastError && (
            <div className="p-4 rounded-xl border border-rose-800/60 bg-rose-950/30 text-rose-300 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-xs text-rose-400">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>Last Encountered Execution Error</span>
              </div>
              <p className="font-mono text-xs text-rose-200 bg-rose-950/60 p-3 rounded-lg border border-rose-900/60 leading-relaxed whitespace-pre-wrap">
                {delivery.lastError}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <span className="text-xs text-slate-400">
            Created: {new Date(delivery.createdAt).toLocaleString()}
          </span>
          <div className="flex items-center space-x-3">
            {(delivery.status === 'FAILED_DLQ' || delivery.status === 'SCHEDULED_RETRY') && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Enqueuing Retry...' : 'Manual Retry Delivery'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
