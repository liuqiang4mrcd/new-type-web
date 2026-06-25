interface ScaffoldStateProps {
  message?: string;
}

export function ScaffoldLoading({
  message = "Loading campaign scaffold...",
}: ScaffoldStateProps) {
  return (
    <section className="mx-auto flex min-h-[420px] w-full max-w-[580px] items-center justify-center px-8 text-center text-[28px] text-slate-500">
      {message}
    </section>
  );
}

export function ScaffoldError({
  message = "Campaign scaffold failed to load.",
}: ScaffoldStateProps) {
  return (
    <section className="mx-auto flex min-h-[420px] w-full max-w-[580px] items-center justify-center px-8 text-center text-[28px] text-red-600">
      {message}
    </section>
  );
}
