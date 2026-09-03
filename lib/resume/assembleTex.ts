import type { ResumeTemplates } from "./loadTemplates";
import {
  InvalidResumeLatexError,
  normalizeModelLatex,
} from "./normalizeModelLatex";

export type AssembleTexParts = {
  preamble: string;
  macros: string;
  documentBody: string;
};

/**
 * Prepend preamble + Jake macros to a document body.
 * `documentBody` must already be `\begin{document}...\end{document}`.
 */
export function assembleTex(parts: AssembleTexParts): string {
  const preamble = parts.preamble.trim();
  const macros = parts.macros.trim();
  const documentBody = parts.documentBody.trim();

  if (!preamble || !macros || !documentBody) {
    throw new InvalidResumeLatexError(
      "Cannot assemble .tex: preamble, macros, or document body is empty",
    );
  }

  return `${preamble}\n\n${macros}\n\n${documentBody}\n`;
}

/**
 * Strip/validate model LaTeX, then assemble a full compilable `.tex` file.
 */
export function assembleResumeTex(
  templates: Pick<ResumeTemplates, "preamble" | "macros">,
  modelOutput: string,
): string {
  return assembleTex({
    preamble: templates.preamble,
    macros: templates.macros,
    documentBody: normalizeModelLatex(modelOutput),
  });
}
