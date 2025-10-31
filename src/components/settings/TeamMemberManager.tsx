'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Check, Mail, Shield } from 'lucide-react';
import useStore from '@/store/useStore';
import { TeamMember } from '@/types';
import {
  createTeamMember,
  deleteTeamMemberRemote,
  fetchTeamMembers,
  updateTeamMemberRemote,
} from '@/lib/supabaseData';
import { isSupabaseEnabled } from '@/lib/supabaseClient';

const defaultMember: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  email: '',
  role: 'secretary',
  status: 'active',
  lastLogin: undefined,
};

export default function TeamMemberManager() {
  const {
    teamMembers,
    setTeamMembers,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
  } = useStore();
  const [form, setForm] = useState(defaultMember);
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

    fetchTeamMembers()
      .then((data) => {
        if (isMounted) {
          setTeamMembers(data);
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setErrorMessage('Não foi possível carregar a equipe administrativa.');
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
  }, [supabaseActive, setTeamMembers]);

  const orderedMembers = useMemo(
    () => teamMembers.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [teamMembers]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (supabaseActive) {
        if (editingId) {
          await updateTeamMemberRemote(editingId, form);
        } else {
          await createTeamMember(form);
        }

        const updated = await fetchTeamMembers();
        setTeamMembers(updated);
      } else {
        if (editingId) {
          updateTeamMember(editingId, form);
        } else {
          const now = new Date().toISOString();
          addTeamMember({
            id: crypto.randomUUID(),
            ...form,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      setForm(defaultMember);
      setEditingId(null);
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível salvar o usuário.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (member: TeamMember) => {
    setForm({
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
      lastLogin: member.lastLogin,
    });
    setEditingId(member.id);
  };

  const handleCancel = () => {
    setForm(defaultMember);
    setEditingId(null);
  };

  const handleRemove = async (id: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (supabaseActive) {
        await deleteTeamMemberRemote(id);
        const updated = await fetchTeamMembers();
        setTeamMembers(updated);
      } else {
        removeTeamMember(id);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível remover o usuário.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Equipe Administrativa</h2>
          <p className="text-sm text-slate-600">Controle de usuários internos (admin, secretarias)</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome*</label>
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
              <Mail className="w-4 h-4 text-gray-500" /> Email*
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="usuario@clinica.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-500" /> Função
            </label>
            <select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as TeamMember['role'] }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="secretary">Secretaria</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as TeamMember['status'] }))}
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
                <Check className="w-4 h-4" /> Atualizar Usuário
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Adicionar Usuário
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Função</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Último Acesso</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orderedMembers.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{member.email}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {member.role === 'admin' ? 'Administrador' : 'Secretaria'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {member.lastLogin
                    ? new Date(member.lastLogin).toLocaleString('pt-BR')
                    : 'Nunca'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                    member.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {member.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(member)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(member.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-70"
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

        {orderedMembers.length === 0 && !isLoading && (
          <div className="text-center py-10 text-sm text-gray-600">Nenhum usuário cadastrado.</div>
        )}
        {isLoading && (
          <div className="text-center py-10 text-sm text-gray-500">Carregando...</div>
        )}
      </div>
    </div>
  );
}
