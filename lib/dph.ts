// DPH "nespolehlivý plátce" (unreliable VAT payer) check via the Czech
// Ministry of Finance ADIS service. Data is NOT in ARES — separate registry.

export type DphResult =
  | { status: "reliable"; checkedAt: string }
  | { status: "unreliable"; since?: string; checkedAt: string }
  | { status: "notfound"; checkedAt: string }
  | { status: "error"; message: string };

/** Client-side: call our own DPH proxy route. */
export async function checkDph(dic: string): Promise<DphResult> {
  const res = await fetch(`/api/dph/${encodeURIComponent(dic.trim())}`);
  return (await res.json()) as DphResult;
}
