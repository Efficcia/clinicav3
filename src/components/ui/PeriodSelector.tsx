'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, CalendarRange, CalendarDays } from 'lucide-react';
import { endOfMonth, endOfWeek, max, min, startOfMonth, startOfWeek } from 'date-fns';
import { PeriodRange, PeriodType } from '@/types/period';

const toInputDate = (date: Date) => {
  const iso = date.toISOString();
  return iso.slice(0, 10);
};

const parseDate = (value?: string) => {
  if (!value) return new Date();
  const parts = value.split('-');
  if (parts.length !== 3) return new Date(value);
  const [year, month, day] = parts.map((part) => Number(part));
  return new Date(year, month - 1, day || 1);
};

const getTodayRange = (): PeriodRange => {
  const today = new Date();
  const formatted = toInputDate(today);
  return { type: 'day', startDate: formatted, endDate: formatted };
};

interface PeriodSelectorProps {
  value: PeriodRange;
  onChange: (range: PeriodRange) => void;
}

const typeOptions: Array<{ value: PeriodType; label: string; icon: React.ReactNode }> = [
  { value: 'day', label: 'Dia', icon: <Calendar className="w-4 h-4" /> },
  { value: 'week', label: 'Semana', icon: <CalendarDays className="w-4 h-4" /> },
  { value: 'month', label: 'Mês', icon: <Clock className="w-4 h-4" /> },
  { value: 'custom', label: 'Período', icon: <CalendarRange className="w-4 h-4" /> },
];

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [internalValue, setInternalValue] = useState<PeriodRange>(() => value ?? getTodayRange());

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleTypeChange = (type: PeriodType) => {
    const reference = parseDate(internalValue.startDate);

    let nextRange: PeriodRange;

    switch (type) {
      case 'day': {
        const day = toInputDate(reference);
        nextRange = { type, startDate: day, endDate: day };
        break;
      }
      case 'week': {
        const start = startOfWeek(reference, { weekStartsOn: 1 });
        const end = endOfWeek(reference, { weekStartsOn: 1 });
        nextRange = {
          type,
          startDate: toInputDate(start),
          endDate: toInputDate(end),
        };
        break;
      }
      case 'month': {
        const start = startOfMonth(reference);
        const end = endOfMonth(reference);
        nextRange = {
          type,
          startDate: toInputDate(start),
          endDate: toInputDate(end),
        };
        break;
      }
      case 'custom':
      default: {
        nextRange = {
          type: 'custom',
          startDate: internalValue.startDate,
          endDate: internalValue.endDate,
        };
      }
    }

    setInternalValue(nextRange);
    onChange(nextRange);
  };

  const handleDayChange = (date: string) => {
    const next = { type: 'day', startDate: date, endDate: date };
    setInternalValue(next);
    onChange(next);
  };

  const handleWeekChange = (date: string) => {
    const reference = parseDate(date);
    const start = startOfWeek(reference, { weekStartsOn: 1 });
    const end = endOfWeek(reference, { weekStartsOn: 1 });
    const next = {
      type: 'week',
      startDate: toInputDate(start),
      endDate: toInputDate(end),
    };
    setInternalValue(next);
    onChange(next);
  };

  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = endOfMonth(start);
    const next = {
      type: 'month',
      startDate: toInputDate(start),
      endDate: toInputDate(end),
    };
    setInternalValue(next);
    onChange(next);
  };

  const handleCustomChange = (field: 'start' | 'end', date: string) => {
    const startDate = field === 'start' ? date : internalValue.startDate;
    const endDate = field === 'end' ? date : internalValue.endDate;

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    const nextStart = toInputDate(min([start, end]));
    const nextEnd = toInputDate(max([start, end]));

    const next = {
      type: 'custom' as const,
      startDate: nextStart,
      endDate: nextEnd,
    };

    setInternalValue(next);
    onChange(next);
  };

  const monthInputValue = useMemo(() => {
    if (internalValue.type !== 'month') {
      return internalValue.startDate.slice(0, 7);
    }
    return internalValue.startDate.slice(0, 7);
  }, [internalValue]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
        {typeOptions.map((option) => {
          const isActive = internalValue.type === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTypeChange(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {internalValue.type === 'day' && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Selecionar dia:</label>
          <input
            type="date"
            value={internalValue.startDate}
            onChange={(event) => handleDayChange(event.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      )}

      {internalValue.type === 'week' && (
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-slate-700">Selecione um dia da semana:</label>
          <input
            type="date"
            value={internalValue.startDate}
            onChange={(event) => handleWeekChange(event.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
          <span className="text-sm text-slate-600 font-medium">
            {internalValue.startDate} até {internalValue.endDate}
          </span>
        </div>
      )}

      {internalValue.type === 'month' && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Selecione o mês:</label>
          <input
            type="month"
            value={monthInputValue}
            onChange={(event) => handleMonthChange(event.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      )}

      {internalValue.type === 'custom' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Início:</label>
            <input
              type="date"
              value={internalValue.startDate}
              max={internalValue.endDate}
              onChange={(event) => handleCustomChange('start', event.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Fim:</label>
            <input
              type="date"
              value={internalValue.endDate}
              min={internalValue.startDate}
              onChange={(event) => handleCustomChange('end', event.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>
      )}
    </div>
  );
}
