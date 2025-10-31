'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, X, Save, AlertCircle } from 'lucide-react';
import useStore from '@/store/useStore';

interface CashBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function CashBalanceModal({ isOpen, onClose, onSave }: CashBalanceModalProps) {
  const { cashBalance, setCashBalance } = useStore();
  const [newBalance, setNewBalance] = useState(cashBalance.toString());
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewBalance(cashBalance.toString());
      setError('');
    }
  }, [isOpen, cashBalance]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSave = () => {
    const numericValue = parseFloat(newBalance.replace(/[^\d.-]/g, ''));

    if (isNaN(numericValue)) {
      setError('Por favor, insira um valor válido');
      return;
    }

    if (numericValue < 0) {
      setError('O saldo não pode ser negativo');
      return;
    }

    setCashBalance(numericValue);
    onSave?.();
    onClose();
  };

  const handleInputChange = (value: string) => {
    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleanValue = value.replace(/[^\d,.-]/g, '');
    setNewBalance(cleanValue);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Editar Saldo em Caixa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">Saldo atual:</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(cashBalance)}</div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Novo saldo
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                R$
              </div>
              <input
                type="text"
                value={newBalance}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 transition-all duration-200 ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="0,00"
              />
            </div>
            {error && (
              <div className="flex items-center mt-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {error}
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <div className="font-medium mb-1">Atenção</div>
                <div>
                  Esta alteração afetará o saldo inicial do Demonstrativo de Fluxo de Caixa.
                  Certifique-se de que o valor está correto.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );
}