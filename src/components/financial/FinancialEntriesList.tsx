'use client';

import React, { useMemo, useState } from 'react';
import { Edit, Trash2, Eye, Calendar, Search } from 'lucide-react';
import { FinancialEntry } from '@/types';
import useStore from '@/store/useStore';
import { isSupabaseEnabled } from '@/lib/supabaseClient';
import { deleteFinancialEntryRemote, fetchFinancialEntries } from '@/lib/supabaseData';

interface FinancialEntriesListProps {
  entries: FinancialEntry[];
  onEdit: (entry: FinancialEntry) => void;
  onView: (entry: FinancialEntry) => void;
}

export default function FinancialEntriesList({ entries, onEdit, onView }: FinancialEntriesListProps) {
  const { deleteFinancialEntry, setFinancialEntries, categories } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const supabaseActive = isSupabaseEnabled();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleDelete = async (entryId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
      try {
        if (supabaseActive) {
          await deleteFinancialEntryRemote(entryId);
          const refreshed = await fetchFinancialEntries();
          setFinancialEntries(refreshed);
        } else {
          deleteFinancialEntry(entryId);
        }
      } catch (error) {
        console.error('Erro ao excluir lançamento financeiro:', error);
        alert('Não foi possível excluir o lançamento.');
      }
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const categoryOptions = useMemo(() => {
    const ordered = new Set<string>();
    categories.income.forEach((category) => ordered.add(category));
    categories.expense.forEach((category) => ordered.add(category));
    entries.forEach((entry) => ordered.add(entry.category));
    return Array.from(ordered);
  }, [categories, entries]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-800">Todos os Lançamentos</h3>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar lançamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">Todos os tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">Todas as categorias</option>
              {categoryOptions.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Data</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Descrição</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Categoria</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Tipo</th>
              <th className="text-right py-4 px-6 text-sm font-semibold text-slate-700">Valor</th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-slate-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                <td className="py-4 px-6 text-sm text-slate-800">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(entry.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{entry.description}</div>
                    {entry.isRecurring && (
                      <div className="text-xs text-blue-600 flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Recorrente</span>
                      </div>
                    )}
                    {entry.notes && (
                      <div className="text-xs text-slate-600 mt-1">{entry.notes}</div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {entry.category}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    entry.type === 'income' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {entry.type === 'income' ? 'Receita' : 'Despesa'}
                  </span>
                </td>
                <td className={`py-4 px-6 text-right font-semibold ${
                  entry.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  <div className="flex items-center justify-end space-x-1">
                    <span className="text-sm">
                      {entry.type === 'income' ? '+' : '-'}
                    </span>
                    <span>{formatCurrency(entry.amount)}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      onClick={() => onView(entry)}
                      className="p-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onEdit(entry)}
                      className="p-2 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lançamento encontrado</h3>
          <p className="text-slate-600">
            {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all' 
              ? 'Tente ajustar os filtros para encontrar lançamentos.'
              : 'Não há lançamentos registrados para este período.'
            }
          </p>
        </div>
      )}

      {/* Summary */}
      {filteredEntries.length > 0 && (
        <div className="p-6 border-t border-gray-100 bg-slate-50/50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">
              Exibindo {filteredEntries.length} de {entries.length} lançamentos
            </span>
            <div className="flex space-x-6">
              <div className="text-emerald-600 font-medium">
                Receitas: {formatCurrency(
                  filteredEntries
                    .filter(e => e.type === 'income')
                    .reduce((sum, e) => sum + e.amount, 0)
                )}
              </div>
              <div className="text-red-600 font-medium">
                Despesas: {formatCurrency(
                  filteredEntries
                    .filter(e => e.type === 'expense')
                    .reduce((sum, e) => sum + e.amount, 0)
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
