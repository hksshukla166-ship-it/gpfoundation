import { prisma } from "@/lib/prisma";
import { updateApplicant } from "../actions";

export default async function ApplicantsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw || 1));
  const take = 20;
  const where = q
    ? { OR: [{ fullName: { contains: q, mode: "insensitive" as const } }, { mobile: { contains: q } }] }
    : {};
  const items = await prisma.applicant.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take });
  return (
    <div>
      <h1 className="font-display text-3xl">Applicants</h1>
      <form className="my-4">
        <input name="q" defaultValue={q} placeholder="Search" className="border px-3 py-2" />
      </form>
      <div className="space-y-4">
        {items.map((a) => (
          <form key={a.id} action={updateApplicant} className="grid gap-2 border bg-white p-4 md:grid-cols-3">
            <input type="hidden" name="id" value={a.id} />
            <input name="fullName" defaultValue={a.fullName} className="border px-2 py-1" />
            <input name="mobile" defaultValue={a.mobile} className="border px-2 py-1" />
            <input name="email" defaultValue={a.email ?? ""} className="border px-2 py-1" />
            <input name="address" defaultValue={a.address} className="border px-2 py-1 md:col-span-2" />
            <input name="district" defaultValue={a.district} className="border px-2 py-1" />
            <input name="state" defaultValue={a.state} className="border px-2 py-1" />
            <button className="bg-navy px-3 py-1 text-xs text-white">SAVE</button>
          </form>
        ))}
      </div>
    </div>
  );
}
