interface DetailField {
  label: string;
  value: React.ReactNode;
}

interface DetailPanelProps {
  fields: DetailField[];
  columns?: 1 | 2 | 3;
}

export function DetailPanel({ fields, columns = 2 }: DetailPanelProps) {
  const gridClass =
    columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2';

  return (
    <dl className={`grid gap-x-6 gap-y-4 ${gridClass}`}>
      {fields.map((f) => (
        <div key={f.label}>
          <dt className="text-sm font-medium text-muted-foreground">{f.label}</dt>
          <dd className="mt-1 text-sm">{f.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

