import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const isCash = params.method === "cash";

  return (
    <main className="success-page">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <p className="eyebrow">BOOKING CONFIRMED</p>
        <h1>You’re locked in.</h1>
        {isCash ? (
          <p>Your first session is reserved on the Balance Point Certified training calendar. Nothing was charged online — the full package balance is paid at your session; cash is welcome.</p>
        ) : (
          <p>Your $20 reservation deposit went through and your first session is being finalized on the Balance Point Certified training calendar.</p>
        )}
        <p>Watch your inbox for your confirmation and training details. The remaining package balance will be handled directly with Balance Point Certified; cash is welcome.</p>
        <Link className="button primary" href="/">Back to site</Link>
      </div>
    </main>
  );
}
