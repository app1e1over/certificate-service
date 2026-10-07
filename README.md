# Certificate service — verification only

Looks up a certificate by ID from an external API, renders it as a two-page certificate + transcript
(matching the TenThousand design), and offers a PDF download of both pages. Stateless — no database.

| Route | What it does |
|---|---|
| `GET /certificates/<id>` | Fetches the certificate and renders the certificate + transcript page (or "not found") |
| `GET /certificates/<id>/pdf` | Streams a generated 2-page PDF of the same content |

## API contract
Calls `GET {CERT_API_URL}?id=<id>` (query param, matching `https://lysbot-production.up.railway.app/api/verify?id=`).

Expected JSON on success:
```json
{
  "status": "success",
  "data": {
    "id": "G7-0A0I-FHE9",
    "full_name": "John Cert",
    "issued_at": "2026-10-07T13:55:54",
    "lectures": [
      { "name": "lecture1", "score": 7, "exam_date": "2026-01-10" }
    ]
  }
}
```
- `lectures` should have 7 entries named `lecture1`..`lecture7` (sorted by that number). Each is matched, in
  order, to the 7 fixed exam names/descriptions in `lib/certificates/exams.ts` — the API only supplies the
  **score** and **exam_date** for each.
- Anything where `status` isn't `"success"`, or an HTTP 404, is treated as "certificate not found".
- A non-2xx status (other than 404), a network error, or unexpected JSON shows "Verification unavailable"
  instead, so a real outage isn't mistaken for an invalid certificate ID.

Set `CERT_API_AUTH` if the API needs a static `Authorization` header.

## What's static vs. from the API
From the API: full name, issue date, certificate ID, and the 7 scores + exam dates.
Static, in `lib/certificates/exams.ts` (edit freely): the 7 exam **names and descriptions**, the programme
labels ("Engineering Internship" / "Frontend Engineering"), the CEO name/signature, and the "Soft skills" /
"Learning & results" paragraphs — the API has no field for that per-student narrative, so it's generic copy
reused on every certificate. Wire it to a real field later if you add one.

## QR code / "Verify" link
Set `PUBLIC_VERIFY_URL` to where you want the QR code and "Verify" box to point (e.g. `https://tenthousand.io/verify`,
appended with `?id=<id>`). Unset, it points at this service's own `/certificates/<id>` page.

## Auto-download
If `localStorage["always-download"] === "true"` in the visitor's browser, the PDF downloads automatically
when the certificate page opens (`components/AutoDownload.tsx`). The visible "Download PDF" button
(`components/DownloadButton.tsx`) works regardless of that flag.

## Run standalone
```bash
npm install
# set CERT_API_URL (and optionally CERT_API_AUTH, PUBLIC_VERIFY_URL) in .env.local
npm run dev   # http://localhost:3000/certificates/<id>
```

## Add to an existing Next.js site (App Router)
Copy these, keeping the paths, then `npm install pdf-lib qrcode` and set the env vars above:
- `app/certificates/`
- `lib/certificates/`
- `components/AutoDownload.tsx`, `components/DownloadButton.tsx`

Don't copy `app/layout.tsx` or `app/page.tsx` — standalone-only; your own layout wraps the pages automatically.
Styling is scoped under a `.tt` class so it won't clash with your site's CSS.

## Fonts / fidelity note
The live page and the PDF approximate the TenThousand design (dark theme, layout, QR, signature block) using
only system fonts (Inter) — I didn't have the real brand font or logo file, so the "TT" mark is drawn as plain
text/a box rather than the actual logo. Swap in the real font and logo asset in `lib/certificates/shell.tsx`
(page) and `lib/certificates/pdf.ts` (PDF) if you have them.

## Docker
```bash
docker build -t certificate-service .
docker run -p 3000:3000 \
  -e CERT_API_URL=https://lysbot-production.up.railway.app/api/verify \
  certificate-service
```
