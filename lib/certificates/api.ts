// Talks to the external certificate API.
// Calls: GET {CERT_API_URL}/api/verify?id=<id>&full_name=<full name>
// Expected JSON:
//   { "status": "success",
//     "data": { "id", "cert_title", "full_name", "issued_at", "soft_skills", "hard_skills",
//               "exams": [{ "name": "Lecture 1", "score": 0-10, "date"?: "YYYY-MM-DD" }, ...] } }
// Any other "status", or a 404, is "certificate not found". Dates are optional and never required.
import { lectureFor, PROGRAM } from "./exams";

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export type ExamResult = { name: string; description: string; mark: number; examDate: string | null };
export type Certificate = {
  id: string;
  title: string; // TRACK.NAME, from cert_title
  fullName: string;
  issuedAt: string;
  softSkills: string; // USER.SOFT_SKILLS
  hardSkills: string; // USER.LEARNING_RESULTS ("Learning & results" box), from hard_skills
  exams: ExamResult[];
};

type ApiExam = { name?: string; score?: number | string; date?: string | null };
type ApiResponse = {
  status?: string;
  data?: {
    id?: string;
    cert_title?: string;
    full_name?: string;
    issued_at?: string;
    soft_skills?: string | string[];
    hard_skills?: string | string[];
    exams?: ApiExam[];
  };
};

// The narrative fields may arrive as a string or a list; either way we want one string.
function text(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string").join(", ").trim();
  return "";
}

export function cleanName(raw: unknown): string | null {
  const v = (Array.isArray(raw) ? raw[0] : raw);
  if (typeof v !== "string") return null;
  const t = v.trim().replace(/\s+/g, " ");
  return t && t.length <= 200 ? t : null;
}

function endpoint(base: string, id: string, fullName: string): string {
  const b = base.replace(/\/+$/, "");
  const path = b.endsWith("/api/verify") ? b : `${b}/api/verify`;
  // encodeURIComponent so spaces are %20 (not "+"), exactly as the API expects.
  return `${path}?id=${encodeURIComponent(id)}&full_name=${encodeURIComponent(fullName)}`;
}

// "Not found" returns null; a broken API / config throws.
export async function fetchCertificate(id: string, fullName: string): Promise<Certificate | null> {
  if (!ID_RE.test(id)) return null;
  const name = cleanName(fullName);
  if (!name) return null;

  const base = process.env.CERT_API_URL;
  if (!base) throw new Error("CERT_API_URL is not set");

  const url = endpoint(base, id, name);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.CERT_API_AUTH) headers.Authorization = process.env.CERT_API_AUTH;

  const res = await fetch(url, { headers, cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Certificate API returned ${res.status}`);

  const json = (await res.json()) as ApiResponse;
  if (json.status !== "success" || !json.data) return null;

  const d = json.data;
  if (typeof d.issued_at !== "string" || !Array.isArray(d.exams)) {
    throw new Error("Certificate API returned an unexpected shape");
  }

  // Title and description come from the exam's name; the score (and the date, if any) come from the API.
  const exams: ExamResult[] = d.exams.map((e) => {
    const meta = lectureFor(typeof e.name === "string" ? e.name : "");
    const score = Number(e.score);
    return {
      name: meta.title,
      description: meta.description,
      mark: Number.isFinite(score) ? Math.min(10, Math.max(0, Math.round(score))) : 0,
      examDate: typeof e.date === "string" && e.date ? e.date : null,
    };
  });

  return {
    id: typeof d.id === "string" && d.id ? d.id : id,
    title: text(d.cert_title) || PROGRAM.fallbackTitle,
    fullName: typeof d.full_name === "string" && d.full_name.trim() ? d.full_name.trim() : name,
    issuedAt: d.issued_at,
    softSkills: text(d.soft_skills),
    hardSkills: text(d.hard_skills),
    exams,
  };
}
