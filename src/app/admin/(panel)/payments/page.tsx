import { prisma } from "@/lib/prisma";
import { formatInrFromPaise } from "@/lib/fees";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const { status, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw || 1));
  const take = 20;
  const where = status ? { status: status as never } : {};
  const items = await prisma.payment.findMany({
    where,
    include: { registration: { include: { applicant: true, course: true } } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * take,
    take,
  });
  return (
    <div>
      <h1 className="font-display text-3xl">Payments</h1>
      <form className="my-4">
        <select name="status" defaultValue={status} className="border px-2 py-1">
          <option value="">All</option>
          <option>CREATED</option>
          <option>PENDING</option>
          <option>SUCCESS</option>
          <option>FAILED</option>
        </select>
        <button className="ml-2 border px-3">Filter</button>
      </form>
      <table className="w-full bg-white text-sm">
        <thead className="bg-navy text-white">
          <tr>
            <th className="p-2 text-left">Order</th>
            <th className="p-2">Payment ID</th>
            <th className="p-2">Applicant</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.razorpayOrderId}</td>
              <td className="p-2">{p.razorpayPaymentId}</td>
              <td className="p-2">{p.registration.applicant.fullName}</td>
              <td className="p-2">{formatInrFromPaise(p.amountPaise)}</td>
              <td className="p-2">{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
