import React from 'react';

interface TableProps {
  headers: string[];
  rows: Array<Record<string, string | number>>;
  rowKey: string;
}

export const Table: React.FC<TableProps> = ({ headers, rows, rowKey }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse bg-background">
        <thead>
          <tr className="bg-muted">
            {headers.map((header) => (
              <th
                key={header}
                className="text-left p-3 border-b border-border font-semibold text-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]} className="hover:bg-muted/50">
              {headers.map((header) => (
                <td
                  key={`${row[rowKey]}-${header}`}
                  className="p-3 border-b border-border text-muted-foreground"
                >
                  {row[header.toLowerCase()]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};