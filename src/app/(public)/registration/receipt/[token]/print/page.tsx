import { notFound, redirect } from "next/navigation";

export default async function PrintReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) notFound();
  redirect(`/api/registration/receipt/${token}?format=html`);
}
