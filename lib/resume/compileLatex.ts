import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const LATEX_COMPILE_TIMEOUT_MS = 45_000;
const PDF_MAGIC = Buffer.from("%PDF");
const USER_COMPILE_FAILED = "Failed to compile resume PDF";
const USER_NOT_CONFIGURED = "LaTeX compilation is not configured";

export class LatexCompileError extends Error {
  readonly name = "LatexCompileError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type CompileLatexOptions = {
  compileUrl?: string;
  latexBin?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
};

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isPdfBuffer(bytes: Buffer): boolean {
  return bytes.length >= PDF_MAGIC.length && bytes.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC);
}

function requirePdf(bytes: Buffer): Buffer {
  if (!isPdfBuffer(bytes)) {
    throw new LatexCompileError(USER_COMPILE_FAILED);
  }
  return bytes;
}

function wrapCompileFailure(error: unknown): never {
  if (error instanceof LatexCompileError) {
    throw error;
  }
  console.error("LaTeX compilation failed:", error);
  throw new LatexCompileError(USER_COMPILE_FAILED);
}

/**
 * latex-on-http lives at POST /builds/sync. If LATEX_COMPILE_URL is only the
 * origin (e.g. a local docker-compose host), append that path.
 */
export function resolveLatexCompileUrl(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new LatexCompileError(USER_NOT_CONFIGURED);
  }
  if (parsed.pathname === "/" || parsed.pathname === "") {
    parsed.pathname = "/builds/sync";
  }
  return parsed.toString();
}

async function compileViaHttp(
  source: string,
  compileUrl: string,
  fetchFn: typeof fetch,
  timeoutMs: number,
): Promise<Buffer> {
  const url = resolveLatexCompileUrl(compileUrl);
  const form = new FormData();
  form.append("compiler", "pdflatex");
  form.append(
    "main.tex",
    new Blob([source], { type: "text/plain" }),
    "main.tex",
  );
  form.append(
    "resources",
    JSON.stringify([{ main: true, multipart: "main.tex" }]),
  );

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    wrapCompileFailure(error);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (response.ok && isPdfBuffer(bytes)) {
    return bytes;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json") || bytes[0] === 0x7b /* { */) {
    try {
      const payload = JSON.parse(bytes.toString("utf8")) as {
        error?: unknown;
      };
      console.error("LaTeX HTTP compile error:", payload.error ?? payload);
    } catch {
      console.error(
        "LaTeX HTTP compile error:",
        response.status,
        bytes.subarray(0, 2048).toString("utf8"),
      );
    }
  } else {
    console.error(
      "LaTeX HTTP compile failed:",
      response.status,
      contentType,
      bytes.subarray(0, 256).toString("utf8"),
    );
  }

  throw new LatexCompileError(USER_COMPILE_FAILED);
}

async function compileViaLocalBin(
  source: string,
  latexBin: string,
  timeoutMs: number,
): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "resume-tex-"));
  try {
    await writeFile(path.join(dir, "main.tex"), source, "utf8");
    try {
      await execFileAsync(
        latexBin,
        [
          "-interaction=nonstopmode",
          "-halt-on-error",
          "-no-shell-escape",
          "main.tex",
        ],
        {
          cwd: dir,
          timeout: timeoutMs,
          windowsHide: true,
          maxBuffer: 8 * 1024 * 1024,
        },
      );
    } catch (error) {
      console.error("pdflatex failed:", error);
      throw new LatexCompileError(USER_COMPILE_FAILED);
    }

    return requirePdf(await readFile(path.join(dir, "main.pdf")));
  } catch (error) {
    if (error instanceof LatexCompileError) {
      throw error;
    }
    wrapCompileFailure(error);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Compile assembled Jake resume LaTeX to PDF.
 *
 * Prefers a local `pdflatex` when `LATEX_BIN` is set (MiKTeX / TeX Live).
 * Otherwise POSTs multipart to `LATEX_COMPILE_URL` (latex-on-http compatible).
 * Vercel cannot ship TeX Live — production should set `LATEX_COMPILE_URL`.
 */
export async function compileLatex(
  source: string,
  options: CompileLatexOptions = {},
): Promise<Buffer> {
  if (typeof source !== "string" || !source.trim()) {
    throw new LatexCompileError(USER_COMPILE_FAILED);
  }

  const latexBin = trimEnv(options.latexBin ?? process.env.LATEX_BIN);
  const compileUrl = trimEnv(
    options.compileUrl ?? process.env.LATEX_COMPILE_URL,
  );
  const timeoutMs = options.timeoutMs ?? LATEX_COMPILE_TIMEOUT_MS;
  const fetchFn = options.fetch ?? fetch;

  if (latexBin) {
    return compileViaLocalBin(source, latexBin, timeoutMs);
  }
  if (compileUrl) {
    return compileViaHttp(source, compileUrl, fetchFn, timeoutMs);
  }

  throw new LatexCompileError(USER_NOT_CONFIGURED);
}
