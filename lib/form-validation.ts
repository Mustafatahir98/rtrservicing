// Shared browser/server rules. Formatting punctuation never counts as digits.
export const phonePattern = String.raw`(?=(?:\D*\d){10,15}\D*$)(?:\d|\+|\(|\)| |\.|-)+`;
export const nonBlankPattern = String.raw`.*\S.*`;
// Require a letter, allow international names and common name punctuation,
// and reject digits/symbols rather than guessing whether a name is real.
export const namePattern = String.raw`(?=.*\p{L})[\p{L}\p{M}\p{Zs}\p{Pd}'\u2019.\u00b7]+`;
export const nameValidationMessage = "Enter a name using letters, spaces, apostrophes, periods or hyphens; numbers are not allowed.";
// Loan IDs can be numeric, while displayed account numbers can include letters and hyphens.
export const accountNumberPattern = String.raw`(?=.*[0-9])[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*`;
export const accountNumberValidationMessage = "Enter an account number with at least one digit; use only letters, numbers and hyphens.";
export const sensitiveMessageError = "Do not send full SSNs, card numbers or bank details. Remove sensitive numbers from your message.";
// Catch full SSNs and long card/account-number runs without rejecting ordinary phone numbers.
const fullSsn = /(?:^|\D)(?:\d{3}[- ]\d{2}[- ]\d{4}|\d{9})(?!\d)/;
const longAccountNumber = /(?:^|\D)(?:\d[ -]?){11,18}\d(?!\d)/;
const labelledBankNumber = /(?:bank\s+account|routing(?:\s+number)?|checking|savings|credit\s+card|debit\s+card)[^\d]{0,24}(?:\d[ -]?){7,18}\d(?!\d)/i;
export function containsSensitiveNumber(value: unknown): boolean {
  return typeof value === "string" && (fullSsn.test(value) || longAccountNumber.test(value) || labelledBankNumber.test(value));
}
export function validOptionalAccountNumber(value: unknown): boolean {
  return value == null || value === "" || typeof value === "string" && value.length <= 30 && new RegExp(`^(?:${accountNumberPattern})$`).test(value);
}
export function validName(value: unknown, max = 100): value is string {
  return validText(value, max) && new RegExp(`^(?:${namePattern})$`, "u").test(value);
}
export function validPhone(value: unknown): value is string {
  return typeof value === "string" && value.length <= 25 && new RegExp(`^(?:${phonePattern})$`).test(value);
}
export function validText(value: unknown, max: number): value is string {
  return typeof value === "string" && Boolean(value.trim()) && value.length <= max;
}
