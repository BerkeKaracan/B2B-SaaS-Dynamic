export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'TRY';

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  'USD',
  'EUR',
  'GBP',
  'TRY',
];

export type FxRatesMap = Partial<Record<SupportedCurrency, number>>;

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as string[]).includes(value);
}

export function normalizeCurrency(
  value: string | null | undefined,
  fallback: SupportedCurrency = 'TRY'
): SupportedCurrency {
  if (!value) return fallback;
  const upper = value.toUpperCase();
  return isSupportedCurrency(upper) ? upper : fallback;
}

/**
 * Convert an amount quoted in USD into the target currency using
 * Frankfurter-style rates where rates[currency] = units of currency per 1 USD.
 */
export function convertFromUsd(
  amountUsd: number,
  currency: SupportedCurrency,
  rates: FxRatesMap
): number {
  if (!Number.isFinite(amountUsd)) return 0;
  if (currency === 'USD') return amountUsd;
  const rate = rates[currency];
  if (rate == null || !Number.isFinite(rate)) return amountUsd;
  return amountUsd * rate;
}

export function formatMoney(
  amount: number,
  currency: SupportedCurrency,
  locale?: string
): string {
  const resolvedLocale =
    locale ??
    (currency === 'TRY'
      ? 'tr-TR'
      : currency === 'EUR'
        ? 'de-DE'
        : currency === 'GBP'
          ? 'en-GB'
          : 'en-US');

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
