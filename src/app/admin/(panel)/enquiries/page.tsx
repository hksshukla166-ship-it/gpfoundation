import { prisma } from "@/lib/prisma";
import { updateEnquiryStatus } from "../actions";

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw || 1));
  const take = 20;
  const where = {
    archived: false,
    ...(q
      ? {
          OR: [{ name: { contains: q, mode: "insensitive" as const } }, { mobile: { contains: q } }],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.enquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take }),
    prisma.enquiry.count({ where }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl">Enquiries</h1>
      <form className="my-4">
        <input name="q" defaultValue={q} placeholder="Search name or mobile" className="border px-3 py-2" />
      </form>
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy text-white">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2">Mobile</th>
              <th className="p-2">Program</th>
              <th className="p-2">Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-2">{item.name}</td>
                <td className="p-2">{item.mobile}</td>
                <td className="p-2">{item.interestedProgram}</td>
                <td className="p-2">{item.status}</td>
                <td className="p-2">
                  <form action={updateEnquiryStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <select name="status" defaultValue={item.status} className="border">
                      <option>NEW</option>
                      <option>CONTACTED</option>
                      <option>RESOLVED</option>
                      <option>ARCHIVED</option>
                    </select>
                    <button className="underline">Update</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">{total} records</p>
    </div>
  );
}
