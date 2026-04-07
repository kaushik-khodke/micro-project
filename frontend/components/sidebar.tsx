'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Heart,
  LayoutDashboard,
  Users,
  Brain,
  Menu,
  X,
  Activity,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, description: 'Triage queue & KPIs' },
  { label: 'Patients', href: '/patients', icon: Users, description: 'Manage records' },
  { label: 'EEG Analysis', href: '/eeg', icon: Brain, description: 'Upload & analyze' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2.5 rounded-xl bg-sidebar text-foreground border border-sidebar-border shadow-2xl"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-40 h-full w-[270px] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-screen flex flex-col bg-sidebar border-r border-sidebar-border">
          {/* Logo */}
          <div className="p-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                <Heart size={20} className="text-primary" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sidebar" />
              </div>
              <div>
                <h1 className="text-base font-black text-foreground tracking-tight leading-none mb-1">NeuroBridge</h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Clinical Platform</p>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="relative">
                <Activity size={12} className="text-emerald-500" />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">System Operational</span>
            </div>
          </div>

          <div className="px-6 mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Navigation</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 border border-transparent ${
                    isActive
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                  <Icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground transition-colors'} />
                  <div className="min-w-0">
                    <span className="block text-sm font-bold tracking-tight">{item.label}</span>
                    <span className={`block text-[10px] font-medium leading-tight ${isActive ? 'text-primary/70' : 'text-muted-foreground/60'}`}>
                      {item.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Section / Pro Badge */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-colors">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-sidebar-border text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <span className="text-xs font-black italic">N</span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-foreground truncate tracking-tight">NeuroBridge Pro</p>
                <div className="flex items-center gap-1.5 leading-none">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Enterprise node</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
