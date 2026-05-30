import { NextResponse } from "next/server";

// Czech Ministry of Finance "nespolehlivý plátce DPH" SOAP service.
const ENDPOINT =
  "https://adisrws.mfcr.cz/adistc/axis2/services/rozhraniCRPDPH.rozhraniCRPDPHPort";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dic: string }> }
) {
  const { dic } = await params;
  const num = dic.replace(/[^0-9]/g, ""); // MFČR wants the number without "CZ"
  const checkedAt = new Date().toISOString();

  if (!num) {
    return NextResponse.json({ status: "error", message: "Neplatné DIČ" });
  }

  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="http://adis.mfcr.cz/rozhraniCRPDPH/">
  <soapenv:Body>
    <urn:StatusNespolehlivyPlatceRequest>
      <urn:dic>${num}</urn:dic>
    </urn:StatusNespolehlivyPlatceRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" },
      body: envelope,
    });
    const xml = await res.text();

    // The MFČR endpoint occasionally answers 200 with an empty body — report
    // that honestly as unavailable rather than as "not a payer".
    if (!xml.trim()) {
      return NextResponse.json({
        status: "error",
        message: "Služba MFČR neodpověděla, zkuste to později",
      });
    }

    const m = xml.match(/nespolehlivyPlatce="([^"]+)"/);
    if (!m) return NextResponse.json({ status: "notfound", checkedAt });

    if (m[1] === "NE") {
      return NextResponse.json({ status: "reliable", checkedAt });
    }
    if (m[1] === "ANO") {
      const since = xml.match(
        /datumZverejneniNespolehlivosti="([^"]+)"/
      )?.[1];
      return NextResponse.json({ status: "unreliable", since, checkedAt });
    }
    return NextResponse.json({ status: "notfound", checkedAt });
  } catch {
    return NextResponse.json({
      status: "error",
      message: "Služba MFČR je nedostupná",
    });
  }
}
