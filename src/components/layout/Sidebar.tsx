'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Heart,
  Activity,
  Users,
  Calendar,
  Settings,
  MessageSquare,
  DollarSign,
  BarChart3,
  LogOut,
  DoorOpen
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Activity },
  { name: 'Pacientes', href: '/patients', icon: Users },
  { name: 'Agenda', href: '/appointments', icon: Calendar },
  { name: 'Ensalamento', href: '/rooms', icon: DoorOpen },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="w-60 bg-white border-r border-slate-200/60 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-slate-600 rounded-lg flex items-center justify-center shadow-sm">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-slate-900 tracking-tight">Clinic[IA]</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <item.icon className={clsx(
                    'w-4 h-4',
                    isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'
                  )} />
                  <span className="tracking-tight">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="px-4 py-4 border-t border-slate-200/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-slate-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-900">
                {user?.name || 'Usuário'}
              </div>
              <div className="text-xs text-slate-500">
                {user?.role === 'admin' ? 'Administrador' : user?.role}
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-slate-500 text-center">
          v1.0.0
        </div>
      </div>
    </div>
  );
}
