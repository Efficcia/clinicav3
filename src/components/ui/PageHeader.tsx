'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, icon: Icon, children }: PageHeaderProps) {
  const pathname = usePathname();

  // Determina se esta é a página ativa baseado no pathname
  // Dashboard (/) não usa este componente, então todas as páginas que usam estão "ativas"
  const isActive = true;

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        {Icon && (
          <div className={clsx(
            'p-3 rounded-xl transition-all duration-200',
            isActive
              ? 'bg-indigo-50 shadow-sm'
              : 'bg-slate-100'
          )}>
            <Icon className={clsx(
              'w-6 h-6',
              isActive ? 'text-indigo-600' : 'text-slate-600'
            )} />
          </div>
        )}
        <div>
          <h1 className={clsx(
            'text-3xl font-bold tracking-tight mb-1 transition-colors duration-200',
            isActive
              ? 'text-indigo-700'
              : 'text-slate-900'
          )}>
            {title}
          </h1>
          {description && (
            <p className="text-slate-600 text-sm">{description}</p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex items-center space-x-3">
          {children}
        </div>
      )}
    </div>
  );
}