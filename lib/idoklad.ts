interface IdokladConnection {
  idoklad_client_id: string
  idoklad_client_secret: string
}

interface InvoiceData {
  datum_vystaveni?: string | null
  datum_splatnosti?: string | null
  variabilni_symbol?: string | null
  popis_plneni?: string | null
  ucetni_kod?: string | null
  dodavatel_nazev?: string | null
  dodavatel_ico?: string | null
  dodavatel_dic?: string | null
  castka_bez_dph?: number | null
  castka_celkem?: number | null
  sazba_dph?: number | null
}

type IdokladApiEnvelope<T = unknown> = {
  Data?: T
  IsSuccess?: boolean
  Message?: string
  ErrorCode?: number
  StatusCode?: number
}

type IdokladList<T> = {
  Items?: T[]
  TotalItems?: number
}

type IdokladContact = {
  Id: number
  CompanyName?: string
  IdentificationNumber?: string
}

type IdokladReceivedDefaults = {
  PaymentOptionId?: number
  NumericSequenceId?: number
  DocumentSerialNumber?: string
  CurrencyId?: number
}

const IDOKLAD_TOKEN_URL = 'https://app.idoklad.cz/identity/server/connect/token'
const IDOKLAD_API = 'https://api.idoklad.cz/v3'
const VAT_MAP: Record<number, number> = { 0: 3, 12: 2, 21: 1 }

async function getIdokladToken(conn: IdokladConnection): Promise<string> {
  const res = await fetch(IDOKLAD_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: conn.idoklad_client_id,
      client_secret: conn.idoklad_client_secret,
      scope: 'idoklad_api',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(
      `iDoklad odmítl přihlášení (${res.status}). Zkontroluj Client ID a Client Secret z Nastavení → Aplikace → API. ${err}`
    )
  }
  const data = await res.json()
  return data.access_token as string
}

function formatIdokladError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as IdokladApiEnvelope
    if (parsed.Message) return `iDoklad: ${parsed.Message}`
  } catch {
    // raw text
  }
  if (status === 404) {
    return 'iDoklad API endpoint neexistuje. Zkontroluj verzi API nebo oprávnění aplikace.'
  }
  if (status === 401 || status === 403) {
    return 'iDoklad odmítl přístup. Zkontroluj Client ID, Client Secret a oprávnění aplikace (Přijaté faktury, Kontakty).'
  }
  if (body.trim()) return `iDoklad API chyba ${status}: ${body}`
  return `iDoklad API chyba ${status}`
}

function unwrapList<T>(data: IdokladList<T> | T[] | undefined): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.Items ?? []
}

async function idokladRequest<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${IDOKLAD_API}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const body = await res.text()
  if (!res.ok) throw new Error(formatIdokladError(res.status, body))

  const parsed = JSON.parse(body) as IdokladApiEnvelope<T>
  if (parsed.IsSuccess === false) {
    throw new Error(parsed.Message || 'iDoklad API vrátilo chybu.')
  }
  return (parsed.Data ?? parsed) as T
}

async function idokladGet<T>(token: string, path: string): Promise<T> {
  return idokladRequest<T>(token, path)
}

async function idokladPost<T>(token: string, path: string, payload: unknown): Promise<T> {
  return idokladRequest<T>(token, path, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function formatIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseInvoiceDate(value: string | null | undefined, fallback: Date): string {
  if (value && String(value).trim()) {
    const trimmed = String(value).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const cz = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
    if (cz) {
      const [, d, m, y] = cz
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() >= 1753) {
      return formatIsoDate(parsed)
    }
  }
  return formatIsoDate(fallback)
}

function buildIdokladDates(invoice: InvoiceData) {
  const today = new Date()
  const dateOfIssue = parseInvoiceDate(invoice.datum_vystaveni, today)
  let dateOfMaturity = parseInvoiceDate(invoice.datum_splatnosti, today)

  const issueMs = new Date(`${dateOfIssue}T12:00:00`).getTime()
  const maturityMs = new Date(`${dateOfMaturity}T12:00:00`).getTime()

  if (maturityMs <= issueMs) {
    const bumped = new Date(`${dateOfIssue}T12:00:00`)
    bumped.setDate(bumped.getDate() + 14)
    dateOfMaturity = formatIsoDate(bumped)
  }

  return {
    DateOfIssue: dateOfIssue,
    DateOfMaturity: dateOfMaturity,
    DateOfReceiving: dateOfIssue,
    DateOfTaxing: dateOfIssue,
  }
}

async function getReceivedInvoiceDefaults(token: string): Promise<IdokladReceivedDefaults> {
  try {
    return await idokladGet<IdokladReceivedDefaults>(token, 'ReceivedInvoices/Default')
  } catch {
    return {}
  }
}

async function getDefaultPaymentOptionId(token: string): Promise<number> {
  const data = await idokladGet<IdokladList<{ Id: number; IsDefault?: boolean }>>(
    token,
    'PaymentOptions?pageSize=50&page=1'
  )
  const items = unwrapList(data)
  const found = items.find((p) => p.IsDefault) ?? items[0]
  if (!found) throw new Error('iDoklad: nenalezena platební metoda. Nastav ji v iDokladu.')
  return found.Id
}

async function getDefaultNumericSequenceId(token: string): Promise<number> {
  const data = await idokladGet<
    IdokladList<{ Id: number; IsDefault?: boolean; DocumentType?: number }>
  >(token, 'NumericSequences?pageSize=50&page=1')
  const items = unwrapList(data)
  // DocumentType 2 = přijatá faktura (ReceivedInvoice)
  const received =
    items.find((s) => s.DocumentType === 2 && s.IsDefault) ??
    items.find((s) => s.DocumentType === 2) ??
    items.find((s) => s.IsDefault) ??
    items[0]
  if (!received) {
    throw new Error('iDoklad: nenalezena číselná řada pro přijaté faktury.')
  }
  return received.Id
}

async function getNextDocumentSerialNumber(
  token: string,
  numericSequenceId: number,
  fallback?: string
): Promise<string> {
  if (fallback && /^\d+$/.test(fallback)) {
    return String(parseInt(fallback, 10) + 1)
  }

  try {
    const data = await idokladGet<
      IdokladList<{ DocumentSerialNumber?: string }>
    >(
      token,
      `ReceivedInvoices?pageSize=1&page=1&filter=NumericSequenceId~eq~${numericSequenceId}&sort=Id~desc`
    )
    const last = unwrapList(data)[0]?.DocumentSerialNumber
    if (last && /^\d+$/.test(last)) return String(parseInt(last, 10) + 1)
  } catch {
    // fallback níže
  }

  return '1'
}

async function findContact(token: string, invoice: InvoiceData): Promise<IdokladContact | null> {
  const ico = invoice.dodavatel_ico?.trim()
  if (ico) {
    try {
      const byIco = await idokladGet<IdokladList<IdokladContact>>(
        token,
        `Contacts?pageSize=1&page=1&filter=IdentificationNumber~eq~${encodeURIComponent(ico)}`
      )
      const hit = unwrapList(byIco)[0]
      if (hit) return hit
    } catch {
      // pokračuj hledáním podle názvu
    }
  }

  const name = invoice.dodavatel_nazev?.trim()
  if (name) {
    try {
      const byName = await idokladGet<IdokladList<IdokladContact>>(
        token,
        `Contacts?pageSize=1&page=1&filter=CompanyName~eq~${encodeURIComponent(name)}`
      )
      const hit = unwrapList(byName)[0]
      if (hit) return hit
    } catch {
      // vytvoříme nový kontakt
    }
  }

  return null
}

async function ensurePartnerId(token: string, invoice: InvoiceData): Promise<number> {
  const existing = await findContact(token, invoice)
  if (existing?.Id) return existing.Id

  const created = await idokladPost<IdokladContact>(token, 'Contacts', {
    CompanyName: invoice.dodavatel_nazev?.trim() || 'Neznámý dodavatel',
    IdentificationNumber: invoice.dodavatel_ico?.trim() || undefined,
    VatIdentificationNumber: invoice.dodavatel_dic?.trim() || undefined,
    CountryId: 1,
  })

  if (!created?.Id) {
    throw new Error('iDoklad: nepodařilo se vytvořit kontakt dodavatele.')
  }
  return created.Id
}

function buildLineItem(invoice: InvoiceData) {
  const vatRate = invoice.sazba_dph ?? 21
  const hasBase = invoice.castka_bez_dph != null && invoice.castka_bez_dph > 0

  return {
    Name: (invoice.popis_plneni ?? 'Přijatá faktura').slice(0, 200),
    Amount: 1,
    Unit: 'ks',
    UnitPrice: hasBase ? invoice.castka_bez_dph : (invoice.castka_celkem ?? 0),
    PriceType: hasBase ? 1 : 0,
    VatRateType: VAT_MAP[vatRate] ?? 1,
    DiscountPercentage: 0,
    IsTaxMovement: false,
  }
}

export async function sendToIdoklad(
  conn: IdokladConnection,
  invoice: InvoiceData
): Promise<{ id: string; url: string; documentNumber?: string; editUrl?: string }> {
  const token = await getIdokladToken(conn)
  const dates = buildIdokladDates(invoice)
  const defaults = await getReceivedInvoiceDefaults(token)

  const numericSequenceId =
    defaults.NumericSequenceId ?? (await getDefaultNumericSequenceId(token))
  const paymentOptionId =
    defaults.PaymentOptionId ?? (await getDefaultPaymentOptionId(token))
  const documentSerialNumber = await getNextDocumentSerialNumber(
    token,
    numericSequenceId,
    defaults.DocumentSerialNumber
  )
  const partnerId = await ensurePartnerId(token, invoice)

  const payload = {
    ...dates,
    PartnerId: partnerId,
    PaymentOptionId: paymentOptionId,
    NumericSequenceId: numericSequenceId,
    DocumentSerialNumber: documentSerialNumber,
    IsIncomeTax: true,
    IsEet: false,
    CurrencyId: defaults.CurrencyId ?? 1,
    VariableSymbol: invoice.variabilni_symbol ?? '',
    Description: invoice.popis_plneni ?? 'Přijatá faktura',
    Items: [buildLineItem(invoice)],
  }

  const created = await idokladPost<{ Id?: number; DocumentNumber?: string }>(
    token,
    'ReceivedInvoices',
    payload
  )
  const id = created?.Id
  if (!id) throw new Error('iDoklad nevrátil ID vytvořené faktury.')

  let documentNumber = created.DocumentNumber
  if (!documentNumber) {
    try {
      const detail = await idokladGet<{ DocumentNumber?: string }>(
        token,
        `ReceivedInvoices/${id}`
      )
      documentNumber = detail.DocumentNumber
    } catch {
      // detail není kritický
    }
  }

  return {
    id: String(id),
    documentNumber,
    url: 'https://app.idoklad.cz/ReceivedInvoices',
    editUrl: `https://app.idoklad.cz/ReceivedInvoice/Edit/${id}`,
  }
}

export async function testIdokladConnection(
  conn: IdokladConnection
): Promise<{ label: string }> {
  const token = await getIdokladToken(conn)

  const data = await idokladGet<
    IdokladList<{ PartnerName?: string; DocumentNumber?: string }>
  >(token, 'ReceivedInvoices?pageSize=1&page=1')

  const items = unwrapList(data)
  const first = items[0]
  const label =
    first?.PartnerName ??
    (items.length > 0 ? `iDoklad (${items.length}+ přijatých faktur)` : 'iDoklad účet')

  return { label }
}
