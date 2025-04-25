/**
 * Generate a unique invoice number in format INV-YYYY-XXX
 * where YYYY is the current year and XXX is a random number
 * @returns Invoice number string
 */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(Math.random() * 900) + 100; // 3-digit number between 100-999
  return `INV-${year}-${randomPart}`;
}
