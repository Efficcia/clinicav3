'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppPage() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <DashboardLayout>
      <div className="h-screen w-full relative">
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600 font-medium">Carregando WhatsApp...</p>
            <p className="text-slate-400 text-sm mt-2">Conectando ao Chatwoot</p>
          </div>
        )}

        {/* Iframe */}
        <iframe
          src="https://chat.meusistema-ia.com/"
          className="w-full h-full border-0"
          title="WhatsApp IA"
          allow="camera; microphone"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </DashboardLayout>
  );
}
