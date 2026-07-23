import React, { useState } from 'react';
import { Navbar, type PageId } from './components/Navbar';
import { Overview } from './pages/Overview';
import { DeliveryExplorer } from './pages/DeliveryExplorer';
import { DLQManager } from './pages/DLQManager';
import { WorkerMonitor } from './pages/WorkerMonitor';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        systemStatus="healthy"
        onRefresh={handleRefresh}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {currentPage === 'overview' && <Overview key={refreshKey} />}
        {currentPage === 'deliveries' && <DeliveryExplorer key={refreshKey} />}
        {currentPage === 'dlq' && <DLQManager key={refreshKey} />}
        {currentPage === 'workers' && <WorkerMonitor key={refreshKey} />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} QueueForge Enterprise System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
