/** Reusable placeholder for pages not yet implemented */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted-foreground">This section is under construction.</p>
    </div>
  );
}

