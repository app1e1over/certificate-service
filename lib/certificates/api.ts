// Talks to the external certificate API.
// Calls: GET {CERT_API_URL}?id=<id>
// Expected JSON: { "status": "success", "data": { "id", "full_name", "issued_at",
//                   "lectures": [{ "name": "lecture1", "score": 1-10, "exam_date": "YYYY-MM-DD" }, ... x7 ] } }
// Any other "status" value, or a non-2xx response, is treated as "certificate not found".
import { EXAMS } from "./exams";

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export type ExamResult = { name: string; description: string; mark: number; examDate: string | null };
export type Certificate = { id: string; fullName: string; issuedAt: string; exams: ExamResult[] };

type ApiLecture = { name?: string; score?: number; exam_date?: string };
type ApiResponse = {
  status?: string;
  data?: { id?: string; full_name?: string; issued_at?: string; lectures?: ApiLecture[] };
};

// Certificates don't exist yet vs. the lookup itself failed are different situations for the page,
// so "not found" returns null while a broken API/config throws.
export async function fetchCertificate(id: string): Promise<Certificate | null> {
  if (!ID_RE.test(id)) return null;

  const base = process.env.CERT_API_URL;
  if (!base) throw new Error("CERT_API_URL is not set");

  const url = new URL(base);
  url.searchParams.set("id", id);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.CERT_API_AUTH) headers.Authorization = process.env.CERT_API_AUTH;

  const res = await fetch(url, { headers, cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Certificate API returned ${res.status}`);

  const json = (await res.json()) as ApiResponse;
  if (json.status !== "success" || !json.data) return null;

  const d = json.data;
  if (typeof d.full_name !== "string" || typeof d.issued_at !== "string") {
    throw new Error("Certificate API returned an unexpected shape");
  }

  // Match API lectures to the 7 fixed exam names/descriptions, in lecture1..lecture7 order.
  const lectures = Array.isArray(d.lectures) ? [...d.lectures] : [];
  lectures.sort((a, b) => (numSuffix(a.name) ?? 0) - (numSuffix(b.name) ?? 0));

  const exams: ExamResult[] = EXAMS.map((meta, i) => {
    const l = lectures[i];
    const mark = Number(l?.score);
    return {
      name: meta.name,
      description: meta.description,
      mark: Number.isFinite(mark) ? Math.min(10, Math.max(0, Math.round(mark))) : 0,
      examDate: typeof l?.exam_date === "string" ? l.exam_date : null,
    };
  });

  return { id: typeof d.id === "string" && d.id ? d.id : id, fullName: d.full_name, issuedAt: d.issued_at, exams };
}

function numSuffix(name?: string): number | null {
  const m = name?.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}
