'use client';

import React from 'react';
import { X, DollarSign, Calendar, FileText, Repeat, Edit } from 'lucide-react';
import { FinancialEntry } from '@/types';

interface FinancialEntryDetailsModalProps {
  entry: FinancialEntry;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (entry: FinancialEntry) => void;
}

export default function FinancialEntryDetailsModal({ 
  entry, 
  isOpen, 
  onClose, 
  onEdit 
}: FinancialEntryDetailsModalProps) {
  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getRecurringLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'yearly': return 'Anual';
      default: return frequency;
    }
  };

  const color = entry.type === 'income' ? 'emerald' : 'red';
  const typeLabel = entry.type === 'income' ? 'Receita' : 'Despesa';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${
              color === 'emerald' 
                ? 'from-emerald-400 to-emerald-500' 
                : 'from-red-400 to-red-500'
            } rounded-full flex items-center justify-center text-white font-bold text-lg`}>
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Detalhes do Lançamento</h2>
              <p className={`text-sm font-medium ${
                color === 'emerald' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {typeLabel}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(entry)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Info */}
          <div className={`bg-${color === 'emerald' ? 'emerald' : 'red'}-50 rounded-xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Informações Principais</h3>
              <div className={`text-3xl font-bold ${
                color === 'emerald' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-700">Descrição</div>
                <div className="font-medium text-gray-900">{entry.description}</div>
              </div>
              <div>
                <div className="text-sm text-slate-700">Categoria</div>
                <div className="font-medium text-gray-900">{entry.category}</div>
              </div>
            </div>
          </div>

          {/* Date and Timing */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Data e Periodicidade</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-700">Data do Lançamento</div>
                <div className="font-medium text-gray-900">{formatDate(entry.date)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-700">Tipo de Lançamento</div>
                <div className="flex items-center space-x-2">
                  {entry.isRecurring ? (
                    <div className="flex items-center space-x-2">
                      <Repeat className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-600">
                        Recorrente ({getRecurringLabel(entry.recurringFrequency || 'monthly')})
                      </span>
                    </div>
                  ) : (
                    <span className="font-medium text-gray-900">Lançamento único</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {entry.notes && (
            <div className="bg-yellow-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-yellow-600" />
                <span>Observações</span>
              </h3>
              <p className="text-slate-800">{entry.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Sistema</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-700">Criado em</div>
                <div className="font-medium text-gray-900">
                  {new Date(entry.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
              <div>
                <div className="text-slate-700">Última atualização</div>
                <div className="font-medium text-gray-900">
                  {new Date(entry.updatedAt).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-6 border-t border-gray-100">
            <button
              onClick={() => onEdit(entry)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            >
              Editar Lançamento
            </button>
            <button 
              onClick={onClose}
              className="flex-1 border border-gray-200 text-slate-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
