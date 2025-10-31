'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import useStore, { FALLBACK_CATEGORY } from '@/store/useStore';

type CategoryType = 'income' | 'expense';

const tabs: Record<CategoryType, { label: string; accent: string; description: string }> = {
  income: {
    label: 'Categorias de Receita',
    accent: 'emerald',
    description: 'Organize as fontes de entrada como consultas, procedimentos e convênios.',
  },
  expense: {
    label: 'Categorias de Despesa',
    accent: 'red',
    description: 'Controle os gastos operacionais, investimentos e financiamentos da clínica.',
  },
};

export default function CategoryManager() {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
  const [activeTab, setActiveTab] = useState<CategoryType>('income');
  const [newCategory, setNewCategory] = useState('');
  const [addError, setAddError] = useState('');
  const [editing, setEditing] = useState<{ type: CategoryType; originalName: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editError, setEditError] = useState('');

  const currentCategories = useMemo(() => categories[activeTab], [categories, activeTab]);

  const handleAddCategory = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = newCategory.trim();
    if (!trimmed) {
      setAddError('Informe um nome válido para a categoria.');
      return;
    }

    const exists = currentCategories.some(
      (category) => category.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setAddError('Já existe uma categoria com esse nome.');
      return;
    }

    addCategory(activeTab, trimmed);
    setNewCategory('');
    setAddError('');
  };

  const startEditing = (type: CategoryType, name: string) => {
    setEditing({ type, originalName: name });
    setEditingValue(name);
    setEditError('');
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditingValue('');
    setEditError('');
  };

  const handleSaveEdit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!editing) {
      return;
    }

    const trimmed = editingValue.trim();
    if (!trimmed) {
      setEditError('O nome da categoria não pode ficar em branco.');
      return;
    }

    const exists = categories[editing.type].some(
      (category) =>
        category.toLowerCase() === trimmed.toLowerCase() &&
        category !== editing.originalName
    );

    if (exists) {
      setEditError('Já existe outra categoria com esse nome.');
      return;
    }

    updateCategory(editing.type, editing.originalName, trimmed);
    cancelEditing();
  };

  const handleDelete = (type: CategoryType, name: string) => {
    if (name === FALLBACK_CATEGORY) {
      return;
    }

    const shouldDelete = window.confirm(
      `Excluir a categoria "${name}"? Todos os lançamentos serão movidos para "${FALLBACK_CATEGORY}".`
    );

    if (!shouldDelete) {
      return;
    }

    deleteCategory(type, name);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-gray-100 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Gerenciamento de Categorias</h3>
          <p className="text-sm text-slate-600">
            Crie, renomeie ou remova categorias para organizar lançamentos financeiros.
          </p>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1">
          {Object.entries(tabs).map(([key, tab]) => {
            const type = key as CategoryType;
            const isActive = type === activeTab;
            return (
              <button
                key={type}
                onClick={() => {
                  setActiveTab(type);
                  setAddError('');
                  if (editing?.type !== type) {
                    cancelEditing();
                  }
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <p className="text-sm text-slate-600 mb-4">{tabs[activeTab].description}</p>
          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={newCategory}
                onChange={(event) => {
                  setNewCategory(event.target.value);
                  setAddError('');
                }}
                placeholder="Informe uma nova categoria"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              {addError && <p className="text-xs text-red-500 mt-1">{addError}</p>}
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {currentCategories.map((category) => {
            const isEditing = editing?.type === activeTab && editing.originalName === category;
            const isProtected = category === FALLBACK_CATEGORY;

            if (isEditing) {
              return (
                <form
                  key={category}
                  onSubmit={handleSaveEdit}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4"
                >
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(event) => {
                      setEditingValue(event.target.value);
                      setEditError('');
                    }}
                    className="flex-1 w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Salvar</span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-slate-700 hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                  {editError && <p className="text-xs text-red-500 w-full sm:w-auto">{editError}</p>}
                </form>
              );
            }

            return (
              <div
                key={category}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-100 rounded-lg px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-slate-800">{category}</div>
                  {isProtected && (
                    <p className="text-xs text-slate-500">
                      Categoria padrão para lançamentos sem classificação.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(activeTab, category)}
                    className="p-2 rounded-lg border border-gray-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isProtected}
                    title={isProtected ? 'Esta categoria não pode ser editada.' : 'Editar categoria'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(activeTab, category)}
                    className="p-2 rounded-lg border border-gray-200 text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isProtected}
                    title={isProtected ? 'Esta categoria não pode ser excluída.' : 'Excluir categoria'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {currentCategories.length === 0 && (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600">
                Nenhuma categoria cadastrada ainda. Adicione a primeira categoria usando o campo acima.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
