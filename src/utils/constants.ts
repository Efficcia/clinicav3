export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  WAITING: 'waiting',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
} as const;

export const APPOINTMENT_STATUS_LABELS = {
  [APPOINTMENT_STATUS.SCHEDULED]: 'Agendado',
  [APPOINTMENT_STATUS.CONFIRMED]: 'Confirmado',
  [APPOINTMENT_STATUS.WAITING]: 'Aguardando',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'Em Andamento',
  [APPOINTMENT_STATUS.COMPLETED]: 'Finalizado',
  [APPOINTMENT_STATUS.CANCELLED]: 'Cancelado',
  [APPOINTMENT_STATUS.NO_SHOW]: 'Não Compareceu'
} as const;

export const FINANCIAL_CATEGORIES = {
  REVENUE: {
    CONSULTATION: 'Consultas',
    PROCEDURES: 'Procedimentos',
    EXAMS: 'Exames',
    OTHER: 'Outras Receitas'
  },
  EXPENSE: {
    SALARY: 'Salários',
    RENT: 'Aluguel',
    EQUIPMENT: 'Equipamentos',
    SUPPLIES: 'Materiais',
    MARKETING: 'Marketing',
    OTHER: 'Outras Despesas'
  }
} as const;

export const WORKING_HOURS = {
  START: '08:00',
  END: '18:00',
  LUNCH_START: '12:00',
  LUNCH_END: '14:00'
} as const;

export const APPOINTMENT_DURATION = 30; // minutes

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50]
} as const;