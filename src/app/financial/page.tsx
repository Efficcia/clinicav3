'use client';

import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Download, BarChart3, PieChart, Tag } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import useStore from '@/store/useStore';
import FinancialEntryForm from '@/components/financial/FinancialEntryForm';
import FinancialEntriesList from '@/components/financial/FinancialEntriesList';
import FinancialEntryDetailsModal from '@/components/financial/FinancialEntryDetailsModal';
import CategoryManager from '@/components/financial/CategoryManager';
import DFCView from '@/components/financial/DFCView';
import { FinancialEntry } from '@/types';
import PeriodSelector from '@/components/ui/PeriodSelector';
import { PeriodRange } from '@/types/period';
import { formatPeriodLabel, getDefaultMonthlyPeriod, periodRangeToDates } from '@/utils/period';

export default function FinancialPage() {
  const { financialEntries } = useStore();
  const [period, setPeriod] = useState<PeriodRange>(getDefaultMonthlyPeriod());
  const [viewMode, setViewMode] = useState<'dre' | 'dfc'>('dre');
  
  // Modals
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(null);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  type FinancialEntryWithDate = FinancialEntry & { dateObj: Date };

  const entriesWithDate = useMemo<FinancialEntryWithDate[]>(
    () => financialEntries.map((entry) => ({ ...entry, dateObj: new Date(entry.date) })),
    [financialEntries]
  );

  const filteredEntries = useMemo(() => {
    const { start, end } = periodRangeToDates(period);

    return entriesWithDate.filter(({ dateObj }) => dateObj >= start && dateObj <= end);
  }, [entriesWithDate, period]);

  const totalIncome = filteredEntries
    .filter(entry => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalExpenses = filteredEntries
    .filter(entry => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const netResult = totalIncome - totalExpenses;

  const incomeByCategory = filteredEntries
    .filter(entry => entry.type === 'income')
    .reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);

  const expensesByCategory = filteredEntries
    .filter(entry => entry.type === 'expense')
    .reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSaveEntry = () => {
    setIsIncomeFormOpen(false);
    setIsExpenseFormOpen(false);
    setSelectedEntry(null);
  };

  const handleEditEntry = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    if (entry.type === 'income') {
      setIsIncomeFormOpen(true);
    } else {
      setIsExpenseFormOpen(true);
    }
    setIsDetailsOpen(false);
  };

  const handleViewEntry = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    setIsDetailsOpen(true);
  };

  const handleExportData = () => {
    const csvContent = [
      ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Método de Pagamento', 'Recorrente'],
      ...filteredEntries.map(entry => [
        new Date(entry.date).toLocaleDateString('pt-BR'),
        entry.type === 'income' ? 'Receita' : 'Despesa',
        entry.category,
        entry.description,
        formatCurrency(entry.amount),
        entry.paymentMethod || '-',
        entry.isRecurring ? 'Sim' : 'Não'
      ])
    ].map(row => row.join(';')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro_${formatPeriodLabel(period).replace(/\s/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 bg-white min-h-screen">
      <PageHeader
        title="Módulo Financeiro"
        description="DRE e Demonstrativo de Fluxo de Caixa"
        icon={DollarSign}
      >
        <button
          onClick={() => {
            setSelectedEntry(null);
            setIsIncomeFormOpen(true);
          }}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-emerald-600/25"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Receita</span>
        </button>

        <button
          onClick={() => {
            setSelectedEntry(null);
            setIsExpenseFormOpen(true);
          }}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-red-600/25"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Despesa</span>
        </button>
      </PageHeader>

      {/* Filtros e Controles */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-slate-200/50 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <PeriodSelector value={period} onChange={setPeriod} />
            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
              <button
                onClick={() => setViewMode('dre')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'dre' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                DRE
              </button>
              <button
                onClick={() => setViewMode('dfc')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'dfc' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <PieChart className="w-4 h-4 inline mr-2" />
                DFC
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsCategoryManagerOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-slate-700 hover:bg-slate-100 hover:border-gray-400 transition-colors shadow-sm"
            >
              <Tag className="w-4 h-4 text-slate-600" />
              <span>Categorias</span>
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-slate-700 hover:bg-slate-100 hover:border-gray-400 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 capitalize">
          {viewMode === 'dre' ? 'Demonstração do Resultado do Exercício' : 'Demonstrativo de Fluxo de Caixa'}
        </h2>
        <p className="text-gray-600">{formatPeriodLabel(period)}</p>
      </div>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Receitas</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Despesas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Resultado Líquido</p>
              <p className={`text-2xl font-bold ${netResult >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(netResult)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${netResult >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-6 h-6 ${netResult >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo por Modo de Visualização */}
      {viewMode === 'dre' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Receitas */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Receitas por Categoria</h3>
            <div className="text-sm text-gray-500">{Object.keys(incomeByCategory).length} categorias</div>
          </div>
          
          <div className="space-y-4">
            {Object.entries(incomeByCategory).map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{category}</div>
                  <div className="text-sm text-gray-600">
                    {Math.round((amount / totalIncome) * 100)}% do total
                  </div>
                </div>
                <div className="font-bold text-green-600">{formatCurrency(amount)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Despesas por Categoria</h3>
            <div className="text-sm text-gray-500">{Object.keys(expensesByCategory).length} categorias</div>
          </div>
          
          <div className="space-y-4">
            {Object.entries(expensesByCategory).map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{category}</div>
                  <div className="text-sm text-gray-600">
                    {Math.round((amount / totalExpenses) * 100)}% do total
                  </div>
                </div>
                <div className="font-bold text-red-600">{formatCurrency(amount)}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
      ) : (
        /* DFC View */
        <DFCView entries={filteredEntries} period={formatPeriodLabel(period)} />
      )}

      {/* Lançamentos Recentes */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 mt-8">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Lançamentos Recentes</h3>
            <button 
              onClick={() => setShowAllEntries(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Data</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Descrição</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Categoria</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Tipo</th>
                <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEntries.slice(0, 10).map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="py-3 px-6 text-sm text-gray-900">
                    {new Date(entry.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-6">
                    <div className="text-sm font-medium text-gray-900">{entry.description}</div>
                    {entry.isRecurring && (
                      <div className="text-xs text-blue-600">Lançamento recorrente</div>
                    )}
                  </td>
                  <td className="py-3 px-6 text-sm text-gray-600">{entry.category}</td>
                  <td className="py-3 px-6">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      entry.type === 'income' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {entry.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className={`py-3 px-6 text-right font-semibold ${
                    entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Entries Modal/View */}
      {showAllEntries && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Todos os Lançamentos</h2>
              <button
                onClick={() => setShowAllEntries(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="sr-only">Fechar</span>
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <FinancialEntriesList
                entries={filteredEntries}
                onEdit={handleEditEntry}
                onView={handleViewEntry}
              />
            </div>
          </div>
        </div>
      )}

      {isCategoryManagerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Gerenciar Categorias</h2>
              <button
                onClick={() => setIsCategoryManagerOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-96px)]">
              <CategoryManager />
            </div>
          </div>
        </div>
      )}

      {/* Income Form Modal */}
      <FinancialEntryForm
        entry={selectedEntry}
        type="income"
        isOpen={isIncomeFormOpen}
        onClose={() => {
          setIsIncomeFormOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleSaveEntry}
      />

      {/* Expense Form Modal */}
      <FinancialEntryForm
        entry={selectedEntry}
        type="expense"
        isOpen={isExpenseFormOpen}
        onClose={() => {
          setIsExpenseFormOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleSaveEntry}
      />

      {/* Entry Details Modal */}
      {selectedEntry && (
        <FinancialEntryDetailsModal
          entry={selectedEntry}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedEntry(null);
          }}
          onEdit={handleEditEntry}
        />
      )}
    </div>
    </DashboardLayout>
  );
}
