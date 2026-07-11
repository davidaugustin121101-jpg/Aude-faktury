-- Grant SELECT on BitFaktura/Súčto columns added in 022 (012 only granted original columns)

GRANT SELECT (
  bitfaktura_domain,
  sucto_company_id
) ON public.accounting_connections TO authenticated;
