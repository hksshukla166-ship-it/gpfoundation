import { prisma } from "@/lib/prisma";
import { formatInrExact } from "@/lib/fees";
import { paymentModeLabel, paymentStatusLabel } from "@/lib/payment-status";
import { syncPendingPaymentsFromRazorpay } from "../actions";

function query(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

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
  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { registration: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    prisma.payment.count({ where }),
  ]);
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] bg-white text-sm">
          <thead className="bg-navy text-white">
            <tr>
              <th className="p-2 text-left">Registration No.</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2">Payment ID</th>
              <th className="p-2">Receipt No.</th>
              <th className="p-2">Course Fee</th>
              <th className="p-2">Hostel Fee</th>
              <th className="p-2">Total</th>
              <th className="p-2">Mode</th>
              <th className="p-2">Status</th>
              <th className="p-2">Date</th>
              <th className="p-2">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const paid = p.status === "SUCCESS";
              const courseFee = p.courseFeePaise ?? Math.max(0, p.amountPaise - (p.hostelFeePaise || 0));
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.registration.applicationId}</td>
                  <td className="p-2">{p.registration.studentName || "—"}</td>
                  <td className="p-2">{p.razorpayPaymentId || "—"}</td>
                  <td className="p-2">{paid ? p.registration.receiptNumber || "—" : "—"}</td>
                  <td className="p-2">{formatInrExact(courseFee)}</td>
                  <td className="p-2">{formatInrExact(p.hostelFeePaise || 0)}</td>
                  <td className="p-2">{formatInrExact(p.amountPaise)}</td>
                  <td className="p-2">{paymentModeLabel(p.paymentMode)}</td>
                  <td className="p-2 font-medium">{paymentStatusLabel(p.status)}</td>
                  <td className="p-2">{(p.paidAt || p.createdAt).toLocaleString("en-IN")}</td>
                  <td className="p-2">
                    {paid && p.registration.receiptToken ? (
                      <a className="underline" href={`/api/registration/receipt/${p.registration.receiptToken}`}>
                        Download
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs">
        {total} records · page {page} of {Math.max(1, Math.ceil(total / take))}
        {page > 1 ? (
          <a className="ml-3 underline" href={`?${query({ status, page: String(page - 1) })}`}>
            Previous
          </a>
        ) : null}
        {page * take < total ? (
          <a className="ml-3 underline" href={`?${query({ status, page: String(page + 1) })}`}>
            Next
          </a>
        ) : null}
      </p>
    </div>
  );
}
