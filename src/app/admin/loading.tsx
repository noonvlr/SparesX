export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-7 w-48 max-w-full animate-pulse rounded bg-[var(--skeleton)]" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-[var(--skeleton)]" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[5.5rem] animate-pulse rounded-[var(--admin-radius)] bg-[var(--skeleton)]"
          />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-11 animate-pulse rounded-[var(--admin-radius)] bg-[var(--skeleton)]"
          />
        ))}
      </div>
    </div>
  );
}
