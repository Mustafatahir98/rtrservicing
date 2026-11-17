import { describe, expect, it } from "vitest";
import { accountNumberPattern, namePattern, validName, validOptionalAccountNumber, validPhone } from "@/lib/form-validation";

describe("public contact field validation", () => {
  it.each(["Mustafa Tahir", "Anne-Marie O'Connor", "José Álvarez", "محمد علی", "A\u0301lvaro"])("accepts a legal name: %s", value => {
    expect(validName(value)).toBe(true);
    expect(new RegExp(`^(?:${namePattern})$`, "u").test(value)).toBe(true);
  });

  it.each(["", "   ", "2312312", "Ali123", "---", "...", "😀", "A@B", "A\nB"])("rejects a non-name: %s", value => {
    expect(validName(value)).toBe(false);
  });

  it("enforces name length", () => {
    expect(validName("A".repeat(100))).toBe(true);
    expect(validName("A".repeat(101))).toBe(false);
    expect(validName("A".repeat(51), 50)).toBe(false);
  });

  it.each([null, undefined, "", "100849201", "RTR-100849", "ABC123"])("accepts an optional account ID: %s", value => {
    expect(validOptionalAccountNumber(value)).toBe(true);
    if (value) expect(new RegExp(`^(?:${accountNumberPattern})$`).test(value)).toBe(true);
  });

  it.each(["weqwe", "RTR-", "-123456", "123 456", "RTR_100849", "123--456", "A".repeat(31), 123456])("rejects a malformed account ID: %s", value => {
    expect(validOptionalAccountNumber(value)).toBe(false);
  });

  it.each(["(555) 123-4567", "+15551234567"])("accepts a phone number: %s", value => {
    expect(validPhone(value)).toBe(true);
  });
  it.each(["123", "abcdefghij", "1234567890123456"])("rejects an invalid phone number: %s", value => {
    expect(validPhone(value)).toBe(false);
  });
});
