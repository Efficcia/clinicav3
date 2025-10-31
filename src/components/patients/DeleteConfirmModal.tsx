'use client';

import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { Patient } from '@/types';

interface DeleteConfirmModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteConfirmModal({ 
  patient, 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting 
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Excluir Paciente</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-slate-700 mb-4">
            Você está prestes a excluir o paciente:
          </p>
          
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {patient.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{patient.name}</div>
                <div className="text-sm text-slate-700">{patient.email}</div>
                <div className="text-sm text-slate-700">{patient.phone}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">⚠️ Atenção:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Esta ação não pode ser desfeita</li>
                  <li>Todos os dados do paciente serão perdidos</li>
                  <li>O histórico de consultas será mantido</li>
                  <li>Agendamentos futuros serão cancelados</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-slate-700 mt-4">
            Digite <strong>EXCLUIR</strong> para confirmar a exclusão:
          </p>
          
          <input
            type="text"
            placeholder="Digite EXCLUIR para confirmar"
            className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            onChange={(e) => {
              const button = document.getElementById('confirm-delete') as HTMLButtonElement;
              if (button) {
                button.disabled = e.target.value !== 'EXCLUIR';
              }
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 text-slate-800 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            id="confirm-delete"
            onClick={onConfirm}
            disabled={true}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Excluindo...' : 'Excluir Paciente'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}