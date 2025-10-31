'use client';

import React, { useState } from 'react';
import { TrendingUp, DollarSign, Calendar, ArrowRight, Edit3 } from 'lucide-react';
import { FinancialEntry } from '@/types';
import useStore from '@/store/useStore';
import CashBalanceModal from './CashBalanceModal';

interface DFCViewProps {
  entries: FinancialEntry[];
  period: string;
}

export default function DFCView({ entries, period }: DFCViewProps) {
  const { cashBalance } = useStore();
  const [isCashBalanceModalOpen, setIsCashBalanceModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // ATIVIDADES OPERACIONAIS - Receitas e despesas do dia a dia da clínica
  const operationalInflows = entries
    .filter(entry => entry.type === 'income' && ['Consultas', 'Procedimentos', 'Exames', 'Convênios', 'Particular'].includes(entry.category))
    .reduce((sum, entry) => sum + entry.amount, 0);

  const operationalOutflows = entries
    .filter(entry => entry.type === 'expense' && ['Salários', 'Encargos', 'Materiais Médicos', 'Medicamentos', 'Aluguel', 'Energia Elétrica', 'Telefone/Internet', 'Contabilidade', 'Marketing', 'Seguros', 'Impostos'].includes(entry.category))
    .reduce((sum, entry) => sum + entry.amount, 0);

  const netOperationalFlow = operationalInflows - operationalOutflows;

  // ATIVIDADES DE INVESTIMENTO - Compra/venda de equipamentos, móveis, tecnologia
  const investmentInflows = entries
    .filter(entry => entry.type === 'income' && ['Venda de Equipamentos', 'Venda de Móveis'].includes(entry.category))
    .reduce((sum, entry) => sum + entry.amount, 0);

  const investmentOutflows = entries
    .filter(entry => entry.type === 'expense' && ['Equipamentos Médicos', 'Móveis e Utensílios', 'Tecnologia', 'Reformas'].includes(entry.category))
    .reduce((sum, entry) => sum + entry.amount, 0);

  const netInvestmentFlow = investmentInflows - investmentOutflows;

  // ATIVIDADES DE FINANCIAMENTO - Empréstimos, aportes de sócios, dividendos
  const financingInflows = entries
    .filter(entry => entry.type === 'income' && ['Empréstimos', 'Aporte de Sócios', 'Financiamentos'].includes(entry.category))
    .reduce((sum, entry) => sum + entry.amount, 0);

  const financingOutflows = entries
    .filter(entry => entry.type === 'expense' && ['Pagamento de Empréstimos', 'Dividendos', 'Amortização de Financiamentos'].includes(entry.category))
    .reduce((sum, entry) => sum + entry.amount, 0);

  const netFinancingFlow = financingInflows - financingOutflows;

  // Totais
  const totalInflows = operationalInflows + investmentInflows + financingInflows;
  const totalOutflows = operationalOutflows + investmentOutflows + financingOutflows;

  // Fluxo líquido
  const netCashFlow = totalInflows - totalOutflows;

  // Usar saldo do store
  const initialBalance = cashBalance;
  const finalBalance = initialBalance + netCashFlow;

  const dfcData = [
    {
      title: 'SALDO INICIAL DE CAIXA',
      amount: initialBalance,
      type: 'initial' as const,
      items: []
    },
    {
      title: 'ATIVIDADES OPERACIONAIS',
      amount: netOperationalFlow,
      type: netOperationalFlow >= 0 ? 'income' : 'expense' as const,
      items: [
        { label: 'Recebimentos de Clientes', value: operationalInflows },
        { label: 'Pagamentos Operacionais', value: -operationalOutflows }
      ]
    },
    {
      title: 'ATIVIDADES DE INVESTIMENTO',
      amount: netInvestmentFlow,
      type: netInvestmentFlow >= 0 ? 'income' : 'expense' as const,
      items: [
        { label: 'Venda de Ativos', value: investmentInflows },
        { label: 'Compra de Equipamentos/Móveis', value: -investmentOutflows }
      ]
    },
    {
      title: 'ATIVIDADES DE FINANCIAMENTO',
      amount: netFinancingFlow,
      type: netFinancingFlow >= 0 ? 'income' : 'expense' as const,
      items: [
        { label: 'Empréstimos/Aportes', value: financingInflows },
        { label: 'Pagamentos/Dividendos', value: -financingOutflows }
      ]
    },
    {
      title: 'VARIAÇÃO LÍQUIDA DE CAIXA',
      amount: netCashFlow,
      type: netCashFlow >= 0 ? 'income' : 'expense' as const,
      items: []
    },
    {
      title: 'SALDO FINAL DE CAIXA',
      amount: finalBalance,
      type: 'final' as const,
      items: []
    }
  ];

  return (
    <div className="space-y-6">
      {/* Resumo das Três Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`rounded-xl p-6 border ${
          netOperationalFlow >= 0 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                netOperationalFlow >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`}>
                Atividades Operacionais
              </p>
              <p className={`text-2xl font-bold ${
                netOperationalFlow >= 0 ? 'text-emerald-800' : 'text-red-800'
              }`}>
                {formatCurrency(netOperationalFlow)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              netOperationalFlow >= 0 ? 'bg-emerald-200' : 'bg-red-200'
            }`}>
              <DollarSign className={`w-6 h-6 ${
                netOperationalFlow >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`} />
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-6 border ${
          netInvestmentFlow >= 0 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                netInvestmentFlow >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>
                Atividades de Investimento
              </p>
              <p className={`text-2xl font-bold ${
                netInvestmentFlow >= 0 ? 'text-blue-800' : 'text-orange-800'
              }`}>
                {formatCurrency(netInvestmentFlow)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              netInvestmentFlow >= 0 ? 'bg-blue-200' : 'bg-orange-200'
            }`}>
              <TrendingUp className={`w-6 h-6 ${
                netInvestmentFlow >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`} />
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-6 border ${
          netFinancingFlow >= 0 
            ? 'bg-purple-50 border-purple-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                netFinancingFlow >= 0 ? 'text-purple-700' : 'text-slate-800'
              }`}>
                Atividades de Financiamento
              </p>
              <p className={`text-2xl font-bold ${
                netFinancingFlow >= 0 ? 'text-purple-800' : 'text-gray-800'
              }`}>
                {formatCurrency(netFinancingFlow)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              netFinancingFlow >= 0 ? 'bg-purple-200' : 'bg-gray-200'
            }`}>
              <Calendar className={`w-6 h-6 ${
                netFinancingFlow >= 0 ? 'text-purple-700' : 'text-slate-800'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* DFC Detalhado */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-slate-800">
            Demonstrativo de Fluxo de Caixa - {period}
          </h3>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {dfcData.map((section, index) => (
              <div key={section.title} className="relative">
                {/* Linha conectora */}
                {index < dfcData.length - 1 && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full h-6 w-px bg-gray-300"></div>
                )}
                
                <div className={`p-6 rounded-xl border-2 ${
                  section.type === 'initial' || section.type === 'final' 
                    ? 'bg-slate-50 border-slate-200' 
                    : section.type === 'income' 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-bold text-lg ${
                        section.type === 'initial' || section.type === 'final'
                          ? 'text-slate-800'
                          : section.type === 'income'
                          ? 'text-emerald-800'
                          : 'text-red-800'
                      }`}>
                        {section.title}
                      </h4>
                      {section.type === 'initial' && (
                        <button
                          onClick={() => setIsCashBalanceModalOpen(true)}
                          className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors group"
                          title="Editar saldo em caixa"
                        >
                          <Edit3 className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
                        </button>
                      )}
                    </div>

                    <div className={`text-2xl font-bold ${
                      section.type === 'initial' || section.type === 'final'
                        ? 'text-slate-800'
                        : section.type === 'income'
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}>
                      {section.type === 'expense' ? '-' : ''}{formatCurrency(Math.abs(section.amount))}
                    </div>
                  </div>

                  {section.items.length > 0 && (
                    <div className="space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex justify-between items-center text-sm">
                          <span className="text-slate-700">{item.label}</span>
                          <span className="font-medium text-gray-800">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seta indicativa */}
                {index < dfcData.length - 1 && (
                  <div className="flex justify-center mt-3 mb-3">
                    <ArrowRight className="w-5 h-5 text-gray-400 transform rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Final */}
        <div className="p-6 bg-slate-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-slate-700">Operacionais</div>
              <div className={`text-lg font-bold ${
                netOperationalFlow >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {formatCurrency(netOperationalFlow)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-700">Investimento</div>
              <div className={`text-lg font-bold ${
                netInvestmentFlow >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {formatCurrency(netInvestmentFlow)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-700">Financiamento</div>
              <div className={`text-lg font-bold ${
                netFinancingFlow >= 0 ? 'text-purple-600' : 'text-slate-700'
              }`}>
                {formatCurrency(netFinancingFlow)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-700">Variação Total</div>
              <div className={`text-lg font-bold ${
                netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Balance Modal */}
      <CashBalanceModal
        isOpen={isCashBalanceModalOpen}
        onClose={() => setIsCashBalanceModalOpen(false)}
        onSave={() => {
          // Optional: Show success notification
        }}
      />
    </div>
  );
}
