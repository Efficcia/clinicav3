'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>('Testando...');
  const [details, setDetails] = useState<any[]>([]);

  useEffect(() => {
    async function testConnection() {
      const results: any[] = [];

      // Teste 1: Cliente configurado
      results.push({
        test: '1. Cliente Supabase configurado',
        result: supabaseClient ? '✅ SIM' : '❌ NÃO',
      });

      if (!supabaseClient) {
        setStatus('❌ Supabase client não configurado');
        setDetails(results);
        return;
      }

      // Teste 2: Buscar patients
      try {
        const startPatients = Date.now();
        const { data: patients, error: patientsError } = await supabaseClient
          .from('patients')
          .select('*')
          .limit(1);
        const durationPatients = Date.now() - startPatients;

        results.push({
          test: '2. Buscar patients',
          result: patientsError ? `❌ ERRO: ${patientsError.message}` : `✅ OK (${durationPatients}ms)`,
          data: patients?.length || 0,
        });
      } catch (error: any) {
        results.push({
          test: '2. Buscar patients',
          result: `❌ EXCEPTION: ${error.message}`,
        });
      }

      // Teste 3: Buscar appointments
      try {
        const startAppointments = Date.now();
        const { data: appointments, error: appointmentsError } = await supabaseClient
          .from('appointments')
          .select('*')
          .limit(1);
        const durationAppointments = Date.now() - startAppointments;

        results.push({
          test: '3. Buscar appointments',
          result: appointmentsError ? `❌ ERRO: ${appointmentsError.message}` : `✅ OK (${durationAppointments}ms)`,
          data: appointments?.length || 0,
        });
      } catch (error: any) {
        results.push({
          test: '3. Buscar appointments',
          result: `❌ EXCEPTION: ${error.message}`,
        });
      }

      // Teste 4: Session
      try {
        const startSession = Date.now();
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        const durationSession = Date.now() - startSession;

        results.push({
          test: '4. Verificar sessão',
          result: sessionError ? `❌ ERRO: ${sessionError.message}` : `✅ OK (${durationSession}ms)`,
          data: session?.user?.email || 'Sem sessão',
        });
      } catch (error: any) {
        results.push({
          test: '4. Verificar sessão',
          result: `❌ EXCEPTION: ${error.message}`,
        });
      }

      setStatus('✅ Testes concluídos');
      setDetails(results);
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Teste de Conexão Supabase</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teste</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resultado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalhes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {details.map((detail, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {detail.test}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {detail.result}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {detail.data !== undefined ? JSON.stringify(detail.data) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Instruções:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Se todos os testes mostrarem ✅, o Supabase está funcionando</li>
            <li>Se mostrar ❌ ERRO, verifique as credenciais e RLS</li>
            <li>Se travar sem resposta, há problema de timeout/rede</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
