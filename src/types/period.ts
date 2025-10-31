export type PeriodType = 'day' | 'week' | 'month' | 'custom';

export interface PeriodRange {
  type: PeriodType;
  startDate: string; // ISO string yyyy-mm-dd
  endDate: string;   // ISO string yyyy-mm-dd
}
