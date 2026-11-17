import { beforeEach, describe, expect, it, vi } from "vitest";
import { callbackConsent } from "@/lib/consent";
import { submitContractCallback, submitContractContact } from "@/api/public-contact";

const api = vi.hoisted(() => ({ callback: vi.fn(), contact: vi.fn() }));
vi.mock("@/api/generated/public/public", () => ({ createCallbackRequest: api.callback, createContactMessage: api.contact }));

const callbackFields = {
  fullName: "Mustafa Tahir", phone: "(555) 123-4567", accountNumber: "RTR-100849",
  timeZone: "Central Time (CT)", callbackWindow: "Morning Window", reason: "Payment or AutoPay Question",
  callbackConsentVersion: callbackConsent.version,
};
const contactFields = {
  firstName: "Mustafa", lastName: "Tahir", phone: "(555) 123-4567", email: "mustafa@example.com",
  accountNumber: "100849201", reason: "Account Transfer", message: "Please call me about my account.",
};
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

beforeEach(() => {
  api.callback.mockResolvedValue({ referenceNumber: "MOCK-CALLBACK-1" });
  api.contact.mockResolvedValue({ referenceNumber: "MOCK-CONTACT-1" });
});

describe("public contact submission adapter", () => {
  it.each(["2312312", "Ali123", "---", " "])("rejects callback name %s without calling API", async fullName => {
    expect((await submitContractCallback(form({ ...callbackFields, fullName }))).status).toBe(400);
    expect(api.callback).not.toHaveBeenCalled();
  });

  it.each(["weqwe", "RTR-", "123 456", "RTR_100849"])("rejects callback account %s without calling API", async accountNumber => {
    expect((await submitContractCallback(form({ ...callbackFields, accountNumber }))).status).toBe(400);
    expect(api.callback).not.toHaveBeenCalled();
  });

  it("accepts numeric and alphanumeric account IDs, normalizes phone and maps fields", async () => {
    for (const accountNumber of ["", "100849201", "RTR-100849"]) {
      expect((await submitContractCallback(form({ ...callbackFields, accountNumber }))).status).toBe(200);
    }
    expect(api.callback).toHaveBeenNthCalledWith(1, expect.objectContaining({ accountNumber: null, phone: "+15551234567", timeZone: "America/Chicago", preferredWindow: "MORNING", reason: "PAYMENT_AUTOPAY" }));
    expect(api.callback).toHaveBeenNthCalledWith(2, expect.objectContaining({ accountNumber: "100849201" }));
    expect(api.callback).toHaveBeenNthCalledWith(3, expect.objectContaining({ accountNumber: "RTR-100849" }));
  });

  it("rejects stale callback consent before calling API", async () => {
    expect((await submitContractCallback(form({ ...callbackFields, callbackConsentVersion: "old" }))).status).toBe(409);
    expect(api.callback).not.toHaveBeenCalled();
  });

  it.each(["firstName", "lastName"])("rejects numeric %s in message", async field => {
    expect((await submitContractContact(form({ ...contactFields, [field]: "2312312" }))).status).toBe(400);
    expect(api.contact).not.toHaveBeenCalled();
  });

  it("rejects invalid full name and account number in messages", async () => {
    expect((await submitContractContact(form({ ...contactFields, fullName: "Ali123" }))).status).toBe(400);
    expect((await submitContractContact(form({ ...contactFields, accountNumber: "weqwe" }))).status).toBe(400);
    expect(api.contact).not.toHaveBeenCalled();
  });

  it("accepts a valid message and combines first and last name", async () => {
    expect((await submitContractContact(form(contactFields))).status).toBe(200);
    expect(api.contact).toHaveBeenCalledWith(expect.objectContaining({ fullName: "Mustafa Tahir", accountNumber: "100849201", reason: "ACCOUNT_TRANSFER" }));
  });

  it.each([
    "My SSN is 123-45-6789; please review this account.",
    "My SSN is 123456789; please review this account.",
    "My card is 4111 1111 1111 1111.",
    "My bank account is 12345678.",
  ])("rejects sensitive message content before API dispatch", async message => {
    const response = await submitContractContact(form({ ...contactFields, message }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/do not send|remove|ssn|bank|sensitive/i);
    expect(api.contact).not.toHaveBeenCalled();
  });
});
