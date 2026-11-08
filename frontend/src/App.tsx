import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { MapView } from './pages/MapView';
import { ReportProblem } from './pages/ReportProblem';
import { ReportDetail } from './pages/ReportDetail';
import { MyReports } from './pages/MyReports';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { BridgeHealth } from './pages/BridgeHealth';
import { AdminDashboard } from './pages/AdminDashboard';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AlertTriangle, Github, Heart } from 'lucide-react';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const handleNavigate = (view: string, reportId?: number) => {
    setCurrentView(view);
    if (reportId !== undefined) {
      setSelectedReportId(reportId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'map':
        return <MapView onNavigate={handleNavigate} />;
      case 'report':
        return <ReportProblem onNavigate={handleNavigate} />;
      case 'report-detail':
        return selectedReportId ? (
          <ReportDetail reportId={selectedReportId} onNavigate={handleNavigate} />
        ) : (
          <Home onNavigate={handleNavigate} />
        );
      case 'my-reports':
        return <MyReports onNavigate={handleNavigate} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'bridge':
        return <BridgeHealth />;
      case 'admin':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'officer':
        return <OfficerDashboard onNavigate={handleNavigate} />;
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      case 'register':
        return <Register onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <div>
        <Navbar currentView={currentView} onNavigate={handleNavigate} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {renderView()}
        </main>
      </div>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600/30 flex items-center justify-center text-blue-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-400">
              FixMyRoad AI &bull; Intelligent Road Infrastructure Platform
            </span>
          </div>

          <div className="text-slate-500 text-[11px]">
            FastAPI &bull; React 19 &bull; OpenCV &bull; YOLOv8 &bull; XGBoost &bull; PostGIS
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

