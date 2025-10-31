import { Patient, Appointment, FinancialEntry, Company, WaitlistEntry, Professional, TeamMember } from '@/types';

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'João Pedro Silva',
    email: 'joao.pedro@email.com',
    phone: '(11) 99876-5432',
    cpf: '123.456.789-01',
    birthDate: '1990-05-20',
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    medicalHistory: 'Saudável',
    allergies: '',
    medications: '',
    emergencyContact: {
      name: 'Maria Silva',
      phone: '(11) 99999-8888',
      relationship: 'Mãe'
    },
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    name: 'Ana Silva Santos',
    email: 'ana.silva@email.com',
    phone: '(11) 98765-4321',
    cpf: '987.654.321-09',
    birthDate: '1985-03-15',
    address: {
      street: 'Rua das Rosas',
      number: '456',
      complement: 'Casa',
      district: 'Jardim',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-890'
    },
    medicalHistory: 'Hipertensão controlada',
    allergies: 'Dipirona',
    medications: 'Losartana 50mg',
    emergencyContact: {
      name: 'João Silva',
      phone: '(11) 99999-8888',
      relationship: 'Esposo'
    },
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z'
  },
  {
    id: '3',
    name: 'Carlos Eduardo Lima',
    email: 'carlos.lima@email.com',
    phone: '(11) 97654-3210',
    cpf: '987.654.321-09',
    birthDate: '1978-07-22',
    address: {
      street: 'Av. Paulista',
      number: '1000',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100'
    },
    medicalHistory: 'Diabetes tipo 2',
    allergies: '',
    medications: 'Metformina 850mg',
    emergencyContact: {
      name: 'Maria Lima',
      phone: '(11) 98888-7777',
      relationship: 'Esposa'
    },
    createdAt: '2024-02-01T10:30:00Z',
    updatedAt: '2024-02-01T10:30:00Z'
  },
  {
    id: '4',
    name: 'Mariana Costa Oliveira',
    email: 'mariana.costa@email.com',
    phone: '(11) 96543-2109',
    cpf: '456.789.123-45',
    birthDate: '1992-11-08',
    address: {
      street: 'Rua Augusta',
      number: '500',
      district: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-000'
    },
    medicalHistory: 'Asma leve',
    allergies: 'Pólen',
    medications: 'Budesonida spray',
    emergencyContact: {
      name: 'Pedro Costa',
      phone: '(11) 97777-6666',
      relationship: 'Pai'
    },
    createdAt: '2024-02-10T14:15:00Z',
    updatedAt: '2024-02-10T14:15:00Z'
  },
  {
    id: '5',
    name: 'Roberto Ferreira',
    email: 'roberto.ferreira@email.com',
    phone: '(11) 95432-1098',
    cpf: '789.123.456-78',
    birthDate: '1965-05-30',
    address: {
      street: 'Rua Oscar Freire',
      number: '200',
      district: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01426-001'
    },
    medicalHistory: 'Artrite reumatoide',
    allergies: '',
    medications: 'Metotrexato 15mg',
    emergencyContact: {
      name: 'Sandra Ferreira',
      phone: '(11) 96666-5555',
      relationship: 'Esposa'
    },
    createdAt: '2024-01-20T09:45:00Z',
    updatedAt: '2024-01-20T09:45:00Z'
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    doctorId: 'dr1',
    doctorName: 'Dr. João Cardiologista',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 60,
    type: 'consultation',
    status: 'confirmed',
    notes: 'Consulta agendada para João Pedro',
    price: 250.00,
    paid: false,
    createdAt: '2024-03-10T08:00:00Z',
    updatedAt: '2024-03-10T08:00:00Z'
  },
  {
    id: '2',
    patientId: '2',
    doctorId: 'dr2',
    doctorName: 'Dra. Maria Endocrinologista',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration: 45,
    type: 'consultation',
    status: 'in-progress',
    notes: 'Acompanhamento diabetes',
    price: 280.00,
    paid: true,
    paymentMethod: 'card',
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2024-03-10T09:00:00Z'
  },
  {
    id: '3',
    patientId: '4',
    doctorId: 'dr3',
    doctorName: 'Dr. Pedro Pneumologista',
    date: new Date().toISOString().split('T')[0],
    time: '08:45',
    duration: 30,
    type: 'consultation',
    status: 'completed',
    notes: 'Consulta finalizada - paciente estável',
    price: 200.00,
    paid: true,
    paymentMethod: 'pix',
    createdAt: '2024-03-10T07:45:00Z',
    updatedAt: '2024-03-10T08:45:00Z'
  },
  {
    id: '4',
    patientId: '5',
    doctorId: 'dr4',
    doctorName: 'Dra. Ana Reumatologista',
    date: new Date().toISOString().split('T')[0],
    time: '11:30',
    duration: 60,
    type: 'consultation',
    status: 'scheduled',
    notes: 'Primeira consulta',
    price: 300.00,
    paid: false,
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z'
  },
  // Próximos dias
  {
    id: '5',
    patientId: '1',
    doctorId: 'dr1',
    doctorName: 'Dr. João Cardiologista',
    date: '2024-12-12',
    time: '14:00',
    duration: 30,
    type: 'return',
    status: 'scheduled',
    notes: 'Retorno para avaliação de exames',
    price: 150.00,
    paid: false,
    createdAt: '2024-03-10T08:00:00Z',
    updatedAt: '2024-03-10T08:00:00Z'
  }
];

export const mockFinancialEntries: FinancialEntry[] = [
  {
    id: '1',
    type: 'income',
    category: 'Consultas',
    description: 'Consulta - Dr. João',
    amount: 280.00,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'card',
    isRecurring: false,
    appointmentId: '2',
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z'
  },
  {
    id: '2',
    type: 'income',
    category: 'Consultas',
    description: 'Consulta - Dr. Pedro',
    amount: 200.00,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'pix',
    isRecurring: false,
    appointmentId: '3',
    createdAt: '2024-03-10T08:45:00Z',
    updatedAt: '2024-03-10T08:45:00Z'
  },
  {
    id: '3',
    type: 'expense',
    category: 'Aluguel',
    description: 'Aluguel do consultório',
    amount: 3500.00,
    date: '2024-03-01',
    paymentMethod: 'bank_transfer',
    isRecurring: true,
    recurringConfig: {
      frequency: 'monthly',
      interval: 1
    },
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-01T08:00:00Z'
  },
  {
    id: '4',
    type: 'expense',
    category: 'Material Médico',
    description: 'Seringas e materiais descartáveis',
    amount: 450.00,
    date: '2024-03-05',
    paymentMethod: 'card',
    isRecurring: false,
    createdAt: '2024-03-05T14:30:00Z',
    updatedAt: '2024-03-05T14:30:00Z'
  },
  {
    id: '5',
    type: 'expense',
    category: 'Funcionários',
    description: 'Salário recepcionista',
    amount: 2500.00,
    date: '2024-03-01',
    paymentMethod: 'bank_transfer',
    isRecurring: true,
    recurringConfig: {
      frequency: 'monthly',
      interval: 1
    },
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-01T08:00:00Z'
  }
];

export const mockCompany: Company = {
  id: '1',
  name: 'Clinic[IA] - Centro Médico',
  cnpj: '12.345.678/0001-90',
  phone: '(11) 3333-4444',
  email: 'contato@clinicia.com.br',
  address: {
    street: 'Av. Faria Lima',
    number: '1500',
    complement: 'Sala 1001',
    district: 'Itaim Bibi',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01451-000'
  },
  businessHours: {
    monday: { open: '08:00', close: '18:00', isOpen: true },
    tuesday: { open: '08:00', close: '18:00', isOpen: true },
    wednesday: { open: '08:00', close: '18:00', isOpen: true },
    thursday: { open: '08:00', close: '18:00', isOpen: true },
    friday: { open: '08:00', close: '17:00', isOpen: true },
    saturday: { open: '08:00', close: '12:00', isOpen: true },
    sunday: { open: '00:00', close: '00:00', isOpen: false }
  },
  specialties: [
    'Cardiologia',
    'Endocrinologia',
    'Pneumologia',
    'Reumatologia',
    'Clínica Geral'
  ],
  aiConfig: {
    enabled: true,
    knowledgeBase: 'Nossa clínica oferece consultas especializadas em cardiologia, endocrinologia, pneumologia e reumatologia. Atendemos de segunda a sábado. Valores das consultas variam de R$ 200 a R$ 350 dependendo da especialidade.',
    tone: 'professional',
    autoScheduling: true
  },
  whatsappConfig: {
    enabled: false,
    evolutionApiUrl: '',
    webhookUrl: ''
  }
};

export const mockWaitlist: WaitlistEntry[] = [
  {
    id: 'w1',
    patientName: 'Beatriz Alves',
    contact: '(11) 99876-5432',
    preferredDoctor: 'Dr. João Cardiologista',
    preferredDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    status: 'waiting',
    notes: 'Paciente deseja encaixe para retorno rápido após exames.'
  },
  {
    id: 'w2',
    patientName: 'Fernando Rocha',
    contact: '(11) 95555-2211',
    preferredDoctor: 'Dra. Maria Endocrinologista',
    preferredDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    status: 'waiting',
    notes: 'Preferência por horário no período da tarde.'
  }
];

export const mockProfessionals: Professional[] = [
  {
    id: 'prof1',
    name: 'Dr. João Cardiologista',
    email: 'joao.cardiologista@clinictech.com',
    phone: '(11) 95555-1111',
    specialty: 'Cardiologia',
    license: 'CRM-SP 123456',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prof2',
    name: 'Dra. Maria Endocrinologista',
    email: 'maria.endocrino@clinictech.com',
    phone: '(11) 94444-2222',
    specialty: 'Endocrinologia',
    license: 'CRM-SP 654321',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prof3',
    name: 'Dr. Pedro Pneumologista',
    email: 'pedro.pneumo@clinictech.com',
    phone: '(11) 93333-3333',
    specialty: 'Pneumologia',
    license: 'CRM-SP 987654',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'staff1',
    name: 'Ana Recepcionista',
    email: 'ana.recepcao@clinictech.com',
    role: 'secretary',
    status: 'active',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'staff2',
    name: 'Carlos Administrativo',
    email: 'carlos.admin@clinictech.com',
    role: 'admin',
    status: 'active',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
