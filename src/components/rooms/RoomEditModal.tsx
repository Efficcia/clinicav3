'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, DoorOpen } from 'lucide-react';
import { Room } from '@/types';
import { createRoom, updateRoom } from '@/lib/roomSchedulingApi';

interface RoomEditModalProps {
  room?: Room;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function RoomEditModal({ room, isOpen, onClose, onSave }: RoomEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    isActive: boolean;
    features: Record<string, any>;
  }>({
    name: '',
    isActive: true,
    features: {},
  });

  useEffect(() => {
    if (isOpen && room) {
      setFormData({
        name: room.name,
        isActive: room.isActive,
        features: room.features || {},
      });
    } else if (isOpen && !room) {
      setFormData({
        name: '',
        isActive: true,
        features: {},
      });
    }
  }, [room, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Verificar se é sala mockup (ID não é UUID válido)
      const isMockRoom = room && !room.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      if (room && !isMockRoom) {
        // Editar sala real do Supabase
        await updateRoom(room.id, formData);
      } else {
        // Criar nova sala (mesmo se estava "editando" uma mockup)
        await createRoom(formData);
        if (isMockRoom) {
          alert('Esta sala era um exemplo. Uma nova sala foi criada no banco de dados!');
        }
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar sala:', error);
      alert(`Erro ao salvar sala: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }));
  };

  if (!isOpen) return null;

  const availableFeatures = [
    { key: 'computador', label: 'Computador' },
    { key: 'ar_condicionado', label: 'Ar Condicionado' },
    { key: 'pia', label: 'Pia' },
    { key: 'equipamentos_cirurgicos', label: 'Equipamentos Cirúrgicos' },
    { key: 'laser', label: 'Laser' },
    { key: 'som_ambiente', label: 'Som Ambiente' },
    { key: 'iluminacao_ajustavel', label: 'Iluminação Ajustável' },
    { key: 'ultrassom', label: 'Ultrassom' },
    { key: 'ecg', label: 'ECG' },
    { key: 'multiplo_uso', label: 'Múltiplo Uso' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DoorOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {room ? 'Editar Sala' : 'Nova Sala'}
              </h2>
              <p className="text-slate-700">
                {room ? 'Atualize as informações da sala' : 'Crie uma nova sala'}
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
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Nome da Sala *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Ex: Sala 1 - Consultório Principal"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Status
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-slate-800">
                Sala ativa
              </label>
            </div>
          </div>

          {/* Características */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-3">
              Características
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableFeatures.map(feature => (
                <div key={feature.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!!formData.features[feature.key]}
                    onChange={() => handleFeatureToggle(feature.key)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    id={feature.key}
                  />
                  <label
                    htmlFor={feature.key}
                    className="ml-2 text-sm text-slate-700"
                  >
                    {feature.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Campos numéricos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Área (m²)
              </label>
              <input
                type="number"
                value={formData.features.area_m2 || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  features: { ...formData.features, area_m2: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="20"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Macas
              </label>
              <input
                type="number"
                value={formData.features.macas || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  features: { ...formData.features, macas: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="1"
                min="0"
              />
            </div>
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
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Sala'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
