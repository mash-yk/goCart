const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Formats integer cents as a currency string, e.g. 12999 -> "$129.99". */
export function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
