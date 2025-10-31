'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, DollarSign, Calendar, FileText, Tag, Repeat } from 'lucide-react';
import { FinancialEntry } from '@/types';
import useStore from '@/store/useStore';
import { isSupabaseEnabled } from '@/lib/supabaseClient';
import {
  createFinancialEntry,
  fetchFinancialEntries,
  updateFinancialEntryRemote,
} from '@/lib/supabaseData';

interface FinancialEntryFormProps {
  entry?: FinancialEntry;
  type: 'income' | 'expense';
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: FinancialEntry) => void;
}

export default function FinancialEntryForm({ 
  entry, 
  type, 
  isOpen, 
  onClose, 
  onSave 
}: FinancialEntryFormProps) {
  const { addFinancialEntry, updateFinancialEntry, setFinancialEntries, categories: storeCategories } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const supabaseActive = isSupabaseEnabled();

  const [formData, setFormData] = useState<Partial<FinancialEntry>>({
    type: type,
    description: '',
    amount: 0,
    category: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringFrequency: 'monthly',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (entry) {
        // Editing existing entry - mapear recurringConfig.frequency para recurringFrequency
        setFormData({
          ...entry,
          date: entry.date ? entry.date.split('T')[0] : new Date().toISOString().split('T')[0],
          recurringFrequency: entry.recurringConfig?.frequency || 'monthly',
        } as any);
      } else {
        // New entry
        setFormData({
          type: type,
          description: '',
          amount: 0,
          category: '',
          date: new Date().toISOString().split('T')[0],
          isRecurring: false,
          recurringFrequency: 'monthly',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [entry, type, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description?.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (!formData.category?.trim()) {
      newErrors.category = 'Categoria é obrigatória';
    }

    if (!formData.date?.trim()) {
      newErrors.date = 'Data é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = new Date().toISOString();
      const isEditing = Boolean(entry);

      // Transformar recurringFrequency em recurringConfig para Supabase
      const { recurringFrequency, ...restFormData } = formData as any;
      const payload = {
        ...restFormData,
        type,
        updatedAt: timestamp,
        ...(isEditing ? {} : { createdAt: timestamp }),
        // Mapear recurringFrequency para recurringConfig se for recorrente
        ...(formData.isRecurring && recurringFrequency ? {
          recurringConfig: {
            frequency: recurringFrequency as 'weekly' | 'monthly' | 'yearly',
            interval: 1,
          }
        } : {}),
      } as Partial<FinancialEntry>;

      if (supabaseActive) {
        if (isEditing && entry) {
          await updateFinancialEntryRemote(entry.id, payload);
        } else {
          await createFinancialEntry(payload);
        }

        const refreshed = await fetchFinancialEntries();
        setFinancialEntries(refreshed);
        const saved = isEditing && entry
          ? refreshed.find((item) => item.id === entry.id) ?? (payload as FinancialEntry)
          : refreshed[refreshed.length - 1] ?? (payload as FinancialEntry);

        onSave(saved as FinancialEntry);
      } else {
        const localId = entry?.id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `tmp-${Date.now()}`);
        const entryData: FinancialEntry = {
          ...(payload as FinancialEntry),
          id: localId,
          createdAt: entry?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };

        if (isEditing && entry) {
          updateFinancialEntry(entry.id, entryData);
        } else {
          addFinancialEntry(entryData);
        }

        onSave(entryData);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = useMemo(() => {
    const options = [...storeCategories[type]];
    const currentValue = formData.category?.trim();

    if (
      currentValue &&
      !options.some((category) => category.toLowerCase() === currentValue.toLowerCase())
    ) {
      options.push(currentValue);
    }

    return options;
  }, [storeCategories, type, formData.category]);
  
  if (!isOpen) return null;
  const title = type === 'income' ? 'Receita' : 'Despesa';
  const color = type === 'income' ? 'green' : 'red';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${color === 'green' ? 'bg-green-100' : 'bg-red-100'} rounded-lg`}>
              <DollarSign className={`w-6 h-6 ${color === 'green' ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {entry ? `Editar ${title}` : `Nova ${title}`}
              </h2>
              <p className="text-slate-700">
                {entry ? `Atualize as informações da ${title.toLowerCase()}` : `Registre uma nova ${title.toLowerCase()}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Descrição *
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                errors.description ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder={`Descrição da ${title.toLowerCase()}`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ''}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                  errors.amount ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="0,00"
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data *
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                  errors.date ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              <Tag className="w-4 h-4 inline mr-2" />
              Categoria *
            </label>
            <select
              value={formData.category || ''}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                errors.category ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="">Selecione uma categoria...</option>
              {categoryOptions.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Lançamento Recorrente */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={formData.isRecurring || false}
                onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm font-medium text-slate-800">
                <Repeat className="w-4 h-4 inline mr-1" />
                Lançamento recorrente
              </label>
            </div>

            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  Frequência
                </label>
                <select
                  value={formData.recurringFrequency || 'monthly'}
                  onChange={(e) => handleInputChange('recurringFrequency', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Observações
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Observações adicionais..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 text-slate-800 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center space-x-2 px-6 py-3 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                color === 'green' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : `Salvar ${title}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
