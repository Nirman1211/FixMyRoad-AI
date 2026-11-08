import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  AlertTriangle, 
  Map, 
  BarChart3, 
  ShieldAlert, 
  Wrench, 
  Layers, 
  PlusCircle, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X,
  Compass
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium">Municipal Admin</span>;
      case 'OFFICER':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">Field Officer</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">Citizen</span>;
    }
  };

  const navItems = [
    { id: 'home', label: 'Overview', icon: <Compass className="w-4 h-4" /> },
    { id: 'map', label: 'GIS Map', icon: <Map className="w-4 h-4" /> },
    { id: 'report', label: 'Report Hazard', icon: <PlusCircle className="w-4 h-4 text-emerald-400" />, highlight: true },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'bridge', label: 'Bridge Health ML', icon: <Layers className="w-4 h-4 text-cyan-400" /> },
  ];

  if (user?.role === 'OFFICER' || user?.role === 'ADMIN') {
    navItems.push({ id: 'officer', label: 'Work Orders', icon: <Wrench className="w-4 h-4 text-amber-400" /> });
  }

  if (user?.role === 'ADMIN') {
    navItems.push({ id: 'admin', label: 'Admin Dispatch', icon: <ShieldAlert className="w-4 h-4 text-rose-400" /> });
  }

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  FixMyRoad<span className="text-blue-500 font-extrabold ml-0.5">AI</span>
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Road Infrastructure Intelligence</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === item.id
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : item.highlight
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* User Profile / Auth State */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <div className="text-right">
                  <div className="text-sm font-semibold text-white leading-tight">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="mt-0.5">{getRoleBadge(user.role)}</div>
                </div>
                <button
                  onClick={() => onNavigate('my-reports')}
                  title="My Reports"
                  className={`p-2 rounded-lg border transition-colors ${
                    currentView === 'my-reports'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all hover:shadow-blue-600/50"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-base font-medium ${
                currentView === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <div className="pt-4 border-t border-slate-800 mt-2">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="mt-0.5">{getRoleBadge(user.role)}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/20 text-red-400 border border-red-500/30"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center text-sm font-medium rounded-lg bg-slate-900 text-white"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onNavigate('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center text-sm font-medium rounded-lg bg-blue-600 text-white"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

