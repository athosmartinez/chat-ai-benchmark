'use client';

import { Card, CardContent } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";

export default function GlobalBenchmarkPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Benchmark Global</h1>

      {/* Cards de estatísticas iniciais (placeholder) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>
      </div>

      {/* Aqui depois virão os gráficos e a tabela */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Comparativo Geral</h2>
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    </div>
  );
}
