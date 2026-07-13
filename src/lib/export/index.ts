import JSZip from 'jszip'
import type { ProcessedInvoice } from '@/types/invoices'
import { normalizeInvoice } from './normalize'
import { validateForExport } from './validate-export'
import type { ExportFormat, ExportInput, ExportProfile, ExportResult } from './types'
import { generateIsdoc } from './generators/isdoc'
import { generatePohodaXml } from './generators/pohoda-xml'
import { generateMoneyIsdoc, moneyIsdocFilename } from './generators/money-s3-isdoc'
import { generateMoneyNativeXml } from './generators/money-s3-native'
import { encodeHeliosCsv, generateHeliosRedCsv } from './generators/helios-red-csv'
import { generateHeliosInuvioXml } from './generators/helios-inuvio-xml'
import { safeFilenamePart } from './xml-utils'

export type { ExportFormat, ExportProfile, ExportValidationResult } from './types'
export {
  isExportFormat,
  EXPORT_FORMATS,
  EXPORT_FORMAT_LABELS,
} from './types'
export { validateForExport } from './validate-export'
export { normalizeInvoice } from './normalize'

export async function generateExport(
  format: ExportFormat,
  input: ExportInput
): Promise<{ result: ExportResult; validation: ReturnType<typeof validateForExport> }> {
  const inv = normalizeInvoice(input.invoice, input.profile)
  const validation = validateForExport(inv, format, {
    forceExport: input.forceExport,
    profile: input.profile,
  })

  if (!validation.ok) {
    return {
      validation,
      result: {
        kind: 'text',
        content: '',
        filename: '',
        contentType: 'text/plain',
      },
    }
  }

  const safeNum = safeFilenamePart(inv.cisloFaktury)

  switch (format) {
    case 'isdoc':
      return {
        validation,
        result: {
          kind: 'text',
          content: generateIsdoc(inv),
          filename: `faktura-${safeNum}.isdoc`,
          contentType: 'application/xml; charset=utf-8',
        },
      }

    case 'pohoda':
      return {
        validation,
        result: {
          kind: 'text',
          content: generatePohodaXml(inv, input.profile),
          filename: `faktura-${safeNum}-pohoda.xml`,
          contentType: 'application/xml; charset=utf-8',
        },
      }

    case 'money_isdoc':
      return {
        validation,
        result: {
          kind: 'text',
          content: generateMoneyIsdoc(inv),
          filename: moneyIsdocFilename(inv),
          contentType: 'application/xml; charset=utf-8',
        },
      }

    case 'money_native':
      return {
        validation,
        result: {
          kind: 'text',
          content: generateMoneyNativeXml(inv, input.profile),
          filename: `faktura-${safeNum}-money.xml`,
          contentType: 'application/xml; charset=utf-8',
        },
      }

    case 'helios_inuvio':
      return {
        validation,
        result: {
          kind: 'text',
          content: generateHeliosInuvioXml(inv, input.profile),
          filename: `faktura-${safeNum}-helios-inuvio.xml`,
          contentType: 'application/xml; charset=utf-8',
        },
      }

    case 'helios_red': {
      const { prifak, pripol } = generateHeliosRedCsv(inv, input.profile)
      const zip = new JSZip()
      zip.file('PRIFAK.csv', encodeHeliosCsv(prifak))
      zip.file('PRIPOL.csv', encodeHeliosCsv(pripol))
      const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
      const ts = Date.now()
      return {
        validation,
        result: {
          kind: 'binary',
          content: buffer,
          filename: `heliosRed_faktura_${safeNum}_${ts}.zip`,
          contentType: 'application/zip',
        },
      }
    }

    default: {
      const _exhaustive: never = format
      throw new Error(`Neznámý formát exportu: ${_exhaustive}`)
    }
  }
}

/** @deprecated Použijte generateExport z @/lib/export */
export async function generateExportLegacy(
  invoice: ProcessedInvoice,
  format: 'isdoc' | 'pohoda',
  profile?: ExportProfile
): Promise<{ content: string; filename: string; contentType: string }> {
  const { result } = await generateExport(format, { invoice, profile })
  if (result.kind === 'binary') {
    throw new Error('Legacy export nepodporuje binární formát')
  }
  return {
    content: result.content,
    filename: result.filename,
    contentType: result.contentType,
  }
}
