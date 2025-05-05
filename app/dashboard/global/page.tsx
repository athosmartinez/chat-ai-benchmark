'use client';

import { useEffect, useState } from 'react';
import { Table } from '@/components/ui/table';
import BarChartComponent from '@/components/barchartcomponent'; // Importa o gráfico

interface VoteData {
  [modelName: string]: { likes: number; dislikes: number };
}

export default function DashboardPage() {
  const [voteData, setVoteData] = useState<VoteData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVotes() {
      try {
        const response = await fetch('/api/vote/dashboard');
        if (!response.ok) {
          throw new Error('Erro ao buscar dados');
        }
        const data = await response.json();
        setVoteData(data);
      } catch (err) {
        setError('Erro ao carregar os dados do dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchVotes();
  }, []);

  const rows = Object.entries(voteData).map(([modelName, { likes, dislikes }]) => ({
    modelo: modelName,
    likes,
    dislikes,
  }));

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-foreground">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="bg-card shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Voting Dashboard by Model</h1>

        {rows.length === 0 ? (
          <p className="text-muted-foreground">Nenhum voto encontrado.</p>
        ) : (
          <>
            <Table
              headers={['Modelo', 'Likes', 'Dislikes']}
              rows={rows}
              rowKey="modelo"
            />

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Vote Graph</h2>
              <BarChartComponent data={rows} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
