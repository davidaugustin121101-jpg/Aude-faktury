import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  parseBankPaymentFields,
  parseCzechBankAccount,
  normalizeIban,
  normalizeSwift,
  normalizeBankCode,
} from '../../src/lib/bank-account'
import { matchIdokladBankByCode } from '../../src/lib/idoklad'

describe('bank-account', () => {
  it('parses Czech account number with bank code', () => {
    assert.deepEqual(parseCzechBankAccount('1234567891/0321'), {
      accountNumber: '1234567891',
      bankCode: '0321',
    })
  })

  it('parses account with trailing slash and separate bank code', () => {
    const bank = parseBankPaymentFields({
      cislo_uctu: '1234567891/',
      kod_banky: '0321',
    })
    assert.equal(bank.accountNumber, '1234567891')
    assert.equal(bank.bankCode, '0321')
  })

  it('normalizes 3-digit bank codes', () => {
    assert.equal(normalizeBankCode('321'), '0321')
  })

  it('normalizes IBAN and SWIFT', () => {
    assert.equal(normalizeIban('cz65 0800 0000 1920 0014 5399'), 'CZ6508000000192000145399')
    assert.equal(normalizeSwift('giba cz px'), 'GIBACZPX')
  })

  it('merges separate bank code with account number', () => {
    const bank = parseBankPaymentFields({
      cislo_uctu: '1234567891',
      kod_banky: '0321',
      iban: null,
      swift: 'FIOBCZPP',
    })
    assert.equal(bank.accountNumber, '1234567891')
    assert.equal(bank.bankCode, '0321')
    assert.equal(bank.swift, 'FIOBCZPP')
  })

  it('matches iDoklad bank by NumberCode', () => {
    assert.equal(
      matchIdokladBankByCode(
        { Id: 42, NumberCode: '321', Name: 'Fio banka', Code: 'FIOBCZPPXXX' },
        '0321'
      ),
      true
    )
  })
})
