export function Field({
  name,
  label,
  defaultValue,
  type = "text",
  textarea,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  const cls = "mt-1 w-full border border-slate-200 bg-white px-3 py-2";
  return (
    <label className="block text-sm">
      {label}
      {textarea ? (
        <textarea name={name} required={required} defaultValue={defaultValue ?? ""} rows={5} className={cls} />
      ) : (
        <input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} className={cls} />
      )}
    </label>
  );
}

export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

export function SaveBar() {
  return (
    <button className="bg-navy px-5 py-2 text-xs font-bold tracking-widest text-white">SAVE</button>
  );
}
