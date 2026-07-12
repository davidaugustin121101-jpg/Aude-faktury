export type ExtractionProgressUpdate = {
  percent: number
  label: string
  phase?: string
}

export type ExtractionStreamEvent =
  | ({ type: 'progress' } & ExtractionProgressUpdate)
  | { type: 'done'; invoice: { id: string }; audit: unknown; autoApproved: boolean }
  | {
      type: 'error'
      error: string
      duplicate?: boolean
      existingInvoiceId?: string
      existingStatus?: string
      status: number
    }

export const EXTRACTION_PROGRESS = {
  hash: { percent: 8, label: 'Kontroluji soubor…', phase: 'hash' },
  prepare: { percent: 18, label: 'Připravuji PDF…', phase: 'prepare' },
  extract: { percent: 28, label: 'AI vytěžuje data…', phase: 'extract' },
  postprocess: { percent: 76, label: 'Doplňuji účetní údaje…', phase: 'postprocess' },
  audit: { percent: 86, label: 'Kontrolní audit…', phase: 'audit' },
  save: { percent: 94, label: 'Ukládám fakturu…', phase: 'save' },
  done: { percent: 100, label: 'Hotovo', phase: 'done' },
} as const satisfies Record<string, ExtractionProgressUpdate>

export type ExtractionProgressReporter = (update: ExtractionProgressUpdate) => void

export function reportProgress(
  reporter: ExtractionProgressReporter | undefined,
  key: keyof typeof EXTRACTION_PROGRESS
): void {
  reporter?.(EXTRACTION_PROGRESS[key])
}

/** Odhadovaný strop animace během čekání na LLM (klient). */
export const EXTRACTION_LLM_PROGRESS_CAP = 72
