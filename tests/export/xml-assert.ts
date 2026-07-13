import { XMLParser, XMLValidator } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
})

export function assertWellFormedXml(xml: string, label: string): void {
  const result = XMLValidator.validate(xml)
  if (result !== true) {
    throw new Error(`${label}: neplatné XML — ${result.err.msg} (řádek ${result.err.line})`)
  }
}

export function parseXml(xml: string): Record<string, unknown> {
  assertWellFormedXml(xml, 'XML')
  return parser.parse(xml) as Record<string, unknown>
}

export function xmlIncludes(xml: string, ...needles: string[]): void {
  for (const needle of needles) {
    if (!xml.includes(needle)) {
      throw new Error(`XML neobsahuje očekávaný řetězec: ${needle}`)
    }
  }
}
