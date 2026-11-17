import type { AuthorizationTerms } from "./generated/model";

export function authorizationText(terms: AuthorizationTerms, values: { amount: string; date: string; schedule: string; last4: string }): string {
  return terms.text.replace(/\{(amount|date|schedule|last4)\}/g, (_, key: keyof typeof values) => values[key]);
}
