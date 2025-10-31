'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Check, User, Phone, Mail, Stethoscope } from 'lucide-react';
import useStore from '@/store/useStore';
import { Professional } from '@/types';
import {
  createProfessional,
  deleteProfessionalRemote,
  fetchProfessionals,
  updateProfessionalRemote,
} from '@/lib/supabaseData';
import { isSupabaseEnabled } from '@/lib/supabaseClient';

const defaultForm: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  email: '',
  phone: '',
  specialty: '',
  license: '',
  status: 'active',
};

export default function ProfessionalManager() {
  const {
    professionals,
    setProfessionals,
    addProfessional,
    updateProfessional,
    removeProfessional,
  } = useStore();
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabaseActive = isSupabaseEnabled();

  useEffect(() => {
    if (!supabaseActive) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    fetchProfessionals()
      .then((data) => {
        if (isMounted) {
          setProfessionals(data);
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setErrorMessage('Não foi possível carregar os profissionais.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [supabaseActive, setProfessionals]);

  const orderedProfessionals = useMemo(
    () => professionals.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [professionals]
  );
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.specialty) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (supabaseActive) {
        if (editingId) {
          await updateProfessionalRemote(editingId, form);
        } else {
          await createProfessional(form);
        }

        const updated = await fetchProfessionals();
        setProfessionals(updated);
      } else {
        if (editingId) {
          updateProfessional(editingId, form);
        } else {
          const now = new Date().toISOString();
          addProfessional({
            id: crypto.randomUUID(),
            ...form,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      setForm(defaultForm);
      setEditingId(null);
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível salvar o profissional.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (professional: Professional) => {
    setForm({
      name: professional.name,
      email: professional.email,
      phone: professional.phone,
      specialty: professional.specialty,
      license: professional.license,
      status: professional.status,
    });
    setEditingId(professional.id);
  };

  const handleCancel = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const handleRemove = async (id: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (supabaseActive) {
        await deleteProfessionalRemote(id);
        const updated = await fetchProfessionals();
        setProfessionals(updated);
      } else {
        removeProfessional(id);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível remover o profissional.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Equipe Médica</h2>
          <p className="text-sm text-slate-600">Gerencie os profissionais disponíveis para agendamento</p>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-6 bg-gray-50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" /> Nome*
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome completo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-gray-500" /> Especialidade*
            </label>
            <input
              type="text"
              value={form.specialty}
              onChange={(event) => setForm((prev) => ({ ...prev, specialty: event.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Cardiologia"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" /> Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="profissional@clinica.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" /> Telefone
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 99999-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registro Profissional</label>
            <input
              type="text"
              value={form.license}
              onChange={(event) => setForm((prev) => ({ ...prev, license: event.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="CRM, CRO, etc"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as Professional['status'] }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-70"
            disabled={isLoading}
          >
            {editingId ? (
              <>
                <Check className="w-4 h-4" /> Atualizar Profissional
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Adicionar Profissional
              </>
            )}
          </button>
        </div>
      </form>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Especialidade</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Contato</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orderedProfessionals.map((professional) => (
              <tr key={professional.id}>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {professional.name}
                  {professional.license && (
                    <span className="block text-xs text-gray-500">{professional.license}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{professional.specialty}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="space-y-1">
                    {professional.email && <div>{professional.email}</div>}
                    {professional.phone && <div>{professional.phone}</div>}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                    professional.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {professional.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(professional)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(professional.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orderedProfessionals.length === 0 && !isLoading && (
          <div className="text-center py-10 text-sm text-gray-600">Nenhum profissional cadastrado.</div>
        )}
        {isLoading && (
          <div className="text-center py-10 text-sm text-gray-500">Carregando...</div>
        )}
      </div>
    </div>
  );
}
