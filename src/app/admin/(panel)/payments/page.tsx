import { prisma } from "@/lib/prisma";
import { formatInrFromPaise } from "@/lib/fees";
import { paymentModeLabel, paymentStatusLabel } from "@/lib/payment-status";
import { syncPendingPaymentsFromRazorpay } from "../actions";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const { status, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw || 1));
  const take = 20;
  const where =
    status === "PENDING"
      ? { status: { in: ["PENDING" as const, "CREATED" as const] } }
      : status
        ? { status: status as never }
        : {};
  const items = await prisma.payment.findMany({
    where,
    include: { registration: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * take,
    take,
  });
  return (
    <div>
      <h1 className="font-display text-3xl">Payments</h1>
      <p className="mt-2 text-sm text-muted">Pending payments stay Pending until the bank confirms. Successful payments show as Successful.</p>
      <div className="my-4 flex flex-wrap items-end gap-3">
        <form>
          <select name="status" defaultValue={status} className="border px-2 py-1">
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="CREATED">Pending (old)</option>
            <option value="SUCCESS">Successful</option>
            <option value="FAILED">Failed</option>
          </select>
          <button className="ml-2 border px-3">Filter</button>
        </form>
        <form action={syncPendingPaymentsFromRazorpay}>
          <button className="bg-navy px-4 py-2 text-xs tracking-widest text-white">REFRESH FROM RAZORPAY</button>
        </form>
      </div>
      <table className="w-full bg-white text-sm">
        <thead className="bg-navy text-white">
          <tr>
            <th className="p-2 text-left">Enrollment / Student ID</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Mode</th>
            <th className="p-2">Date & time</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.registration.applicationId}</td>
              <td className="p-2">{p.registration.studentName || "—"}</td>
              <td className="p-2">{formatInrFromPaise(p.amountPaise)}</td>
              <td className="p-2">{paymentModeLabel(p.paymentMode)}</td>
              <td className="p-2">{(p.paidAt || p.createdAt).toLocaleString("en-IN")}</td>
              <td className="p-2 font-medium">{paymentStatusLabel(p.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
