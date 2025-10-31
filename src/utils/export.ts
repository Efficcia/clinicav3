import { Patient, Appointment, FinancialEntry } from '@/types';

export const exportToCSV = <T extends Record<string, unknown>>(data: T[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];

        if (typeof value === 'string') {
          return value.includes(',') ? `"${value}"` : value;
        }

        if (value === null || value === undefined) {
          return '';
        }

        return String(value);
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const formatPatientsForExport = (patients: Patient[]) => {
  return patients.map(patient => ({
    Nome: patient.name,
    Email: patient.email,
    Telefone: patient.phone,
    CPF: patient.cpf,
    'Data de Nascimento': patient.birthDate,
    'Data de Cadastro': new Date(patient.createdAt).toLocaleDateString('pt-BR'),
    Endereço: patient.address,
    Observações: patient.notes || ''
  }));
};

export const formatAppointmentsForExport = (appointments: Appointment[]) => {
  return appointments.map(appointment => ({
    'Nome do Paciente': appointment.patientName,
    'Nome do Médico': appointment.doctorName,
    Data: appointment.date,
    Hora: appointment.time,
    Status: appointment.status,
    Observações: appointment.notes || ''
  }));
};

export const formatFinancialForExport = (entries: FinancialEntry[]) => {
  return entries.map(entry => ({
    Descrição: entry.description,
    Valor: `R$ ${entry.amount.toFixed(2)}`,
    Tipo: entry.type === 'income' ? 'Receita' : 'Despesa',
    Categoria: entry.category,
    Data: entry.date,
    Observações: entry.notes || ''
  }));
};
