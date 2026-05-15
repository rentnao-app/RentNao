export default function AdminPlaceholderSection({ title, description }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <p className="mt-4 text-sm text-slate-500">
        This section is now clickable from the drawer. You can connect it to dedicated APIs/components when ready.
      </p>
    </section>
  );
}
