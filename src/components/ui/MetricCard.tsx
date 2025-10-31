'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorConfig = {
  blue: {
    bg: 'bg-indigo-50',
    icon: 'bg-indigo-500',
    text: 'text-indigo-600'
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-500',
    text: 'text-emerald-600'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-500',
    text: 'text-purple-600'
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-500',
    text: 'text-orange-600'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-500',
    text: 'text-red-600'
  },
};

export default function MetricCard({ title, value, change, icon: Icon, color }: MetricCardProps) {
  return (
    <div className="bg-white/90 rounded-xl p-6 border border-slate-200/60 hover:border-slate-300/60 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${colorConfig[color].bg} ${colorConfig[color].text} mb-3`}>
            {title}
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            {value}
          </div>
          {change !== undefined && (
            <div className="flex items-center space-x-1.5">
              {change > 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className={`text-sm font-medium ${change > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-slate-500 text-sm">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 ${colorConfig[color].icon} rounded-lg shadow-sm`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}