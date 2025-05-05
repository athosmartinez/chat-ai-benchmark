import { NextResponse } from 'next/server';
import { getVoteCountsByModel } from '../../../../../lib/db/queries'; // Ajuste o caminho conforme sua estrutura

export async function GET() {
  try {
    const voteCounts = await getVoteCountsByModel();

    // Formatar o resultado no formato { "llmName": { likes: number, dislikes: number } }
    const result: Record<string, { likes: number; dislikes: number }> = {};

    voteCounts.forEach((model) => {
      result[model.modelName] = {
        likes: model.upvotes,
        dislikes: model.downvotes,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar votos globais:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}