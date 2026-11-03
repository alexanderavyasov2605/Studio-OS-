type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 sm:p-12">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Этап 1 · Техническая основа
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-5 leading-7 text-slate-600">{description}</p>
      <p className="mt-8 border-t border-slate-100 pt-5 text-sm text-slate-500">
        Страница-заглушка. Рабочие функции пока не подключены.
      </p>
    </section>
  );
}
