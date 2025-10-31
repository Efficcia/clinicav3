import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { PeriodRange } from '@/types/period';

export const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

export const getDefaultMonthlyPeriod = (): PeriodRange => {
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);

  return {
    type: 'month',
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
};

export const getDefaultWeeklyPeriod = (): PeriodRange => {
  const today = new Date();
  // Garantir que estamos usando a data local correta
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = startOfWeek(localToday, { weekStartsOn: 1 });
  const end = endOfWeek(start, { weekStartsOn: 1 });

  return {
    type: 'week',
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
};

export const getDefaultDailyPeriod = (): PeriodRange => {
  const today = new Date();
  const formatted = toIsoDate(today);
  return {
    type: 'day',
    startDate: formatted,
    endDate: formatted,
  };
};

export const formatPeriodLabel = (period: PeriodRange) => {
  const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) =>
    new Date(value).toLocaleDateString('pt-BR', options);

  switch (period.type) {
    case 'day':
      return formatDate(period.startDate, { day: '2-digit', month: 'long', year: 'numeric' });
    case 'week':
      return `${formatDate(period.startDate, { day: '2-digit', month: 'short' })} - ${formatDate(period.endDate, { day: '2-digit', month: 'short', year: 'numeric' })}`;
    case 'month':
      return formatDate(period.startDate, { month: 'long', year: 'numeric' });
    case 'custom':
    default:
      return `${formatDate(period.startDate, { day: '2-digit', month: 'short', year: 'numeric' })} - ${formatDate(period.endDate, { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }
};

export const periodRangeToDates = (period: PeriodRange) => ({
  start: new Date(period.startDate),
  end: new Date(period.endDate),
});
