'use client';

import React from 'react';
import { Heart } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader({ message = 'Carregando...' }: PageLoaderProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">{message}</p>
      </div>
    </div>
  );
}