import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContactForms from "@/components/contact-forms";

const api = vi.hoisted(() => ({ callback: vi.fn(), contact: vi.fn() }));
vi.mock("@/lib/api/public-contact", () => ({ submitContractCallback: api.callback, submitContractContact: api.contact }));

const field = (name: string) => document.querySelector<HTMLInputElement>(`[role="tabpanel"]:not([hidden]) input[name="${name}"]`)!;

beforeEach(() => {
  api.callback.mockResolvedValue(Response.json({ ok: true }));
  api.contact.mockResolvedValue(Response.json({ ok: true }));
});

describe("public contact forms", () => {
  it("blocks numeric and mixed-digit names before submitting", async () => {
    const user = userEvent.setup();
    render(<ContactForms />);
    fireEvent.change(field("phone"), { target: { value: "(555) 123-4567" } });
    for (const name of ["2312312", "Ali123", "---", "😀"]) {
      fireEvent.change(field("fullName"), { target: { value: name } });
      expect(field("fullName")).toBeInvalid();
      await user.click(screen.getByRole("button", { name: "Request a Callback" }));
      expect(api.callback).not.toHaveBeenCalled();
    }
  });

  it("rejects letters-only account numbers and accepts the displayed RTR format", async () => {
    const user = userEvent.setup();
    render(<ContactForms />);
    fireEvent.change(field("fullName"), { target: { value: "Mustafa Tahir" } });
    fireEvent.change(field("phone"), { target: { value: "(555) 123-4567" } });
    fireEvent.change(field("accountNumber"), { target: { value: "weqwe" } });
    expect(field("accountNumber")).toBeInvalid();
    await user.click(screen.getByRole("button", { name: "Request a Callback" }));
    expect(api.callback).not.toHaveBeenCalled();
    fireEvent.change(field("accountNumber"), { target: { value: "RTR-100849" } });
    expect(field("accountNumber")).toBeValid();
    await user.click(screen.getByRole("button", { name: "Request a Callback" }));
    await waitFor(() => expect(api.callback).toHaveBeenCalledOnce());
    expect(api.callback.mock.calls[0][0].get("accountNumber")).toBe("RTR-100849");
  });

  it("allows an empty optional account number", async () => {
    const user = userEvent.setup();
    render(<ContactForms />);
    fireEvent.change(field("fullName"), { target: { value: "Mustafa Tahir" } });
    fireEvent.change(field("phone"), { target: { value: "(555) 123-4567" } });
    expect(field("accountNumber")).toBeValid();
    await user.click(screen.getByRole("button", { name: "Request a Callback" }));
    await waitFor(() => expect(api.callback).toHaveBeenCalledOnce());
  });

  it("validates both message names and the optional account number", async () => {
    const user = userEvent.setup();
    render(<ContactForms />);
    await user.click(screen.getByRole("tab", { name: "Send Online Message" }));
    fireEvent.change(field("firstName"), { target: { value: "2312312" } });
    fireEvent.change(field("lastName"), { target: { value: "Tahir" } });
    expect(field("firstName")).toBeInvalid();
    fireEvent.change(field("firstName"), { target: { value: "Mustafa" } });
    fireEvent.change(field("accountNumber"), { target: { value: "weqwe" } });
    expect(field("accountNumber")).toBeInvalid();
    fireEvent.change(field("accountNumber"), { target: { value: "100849201" } });
    expect(field("accountNumber")).toBeValid();
    fireEvent.change(field("email"), { target: { value: "mustafa@example.com" } });
    fireEvent.change(field("phone"), { target: { value: "(555) 123-4567" } });
    fireEvent.change(document.querySelector<HTMLTextAreaElement>('textarea[name="message"]')!, { target: { value: "Please call me." } });
    await user.click(screen.getByRole("button", { name: "Send Message" }));
    await waitFor(() => expect(api.contact).toHaveBeenCalledOnce());
    expect(api.contact.mock.calls[0][0].get("accountNumber")).toBe("100849201");
  });
});
