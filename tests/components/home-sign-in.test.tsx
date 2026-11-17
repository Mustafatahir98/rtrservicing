import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeSignIn from "@/components/home-sign-in";

const state = vi.hoisted(() => ({ mockMode: true, push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock("@/lib/mock-mode", () => ({ get borrowerMockMode() { return state.mockMode; } }));
vi.mock("@/lib/mock-worker-ready", () => ({ waitForMockWorker: () => Promise.resolve() }));

// Registration itself is tested separately; this stub exercises the parent's
// registration completion callback without testing another component's internals.
vi.mock("@/components/home-register", () => ({
  default: ({ phone, onComplete }: { phone: string; onComplete: (email: string) => void }) => (
    <section id="register">
      <h2>Create your account</h2>
      <p>{phone}</p>
      <button onClick={() => onComplete("new.borrower@example.com")}>Complete registration</button>
    </section>
  ),
}));

const phone = "877-252-3761";
const fetchMock = vi.fn<typeof fetch>();
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json" },
});

async function submitCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: "Email" }), "borrower@example.com");
  await user.type(screen.getByLabelText("Password", { exact: true }), "BorrowerPassword123!");
  await user.click(screen.getByRole("button", { name: "Sign in to your Account" }));
}

async function enterVerification(user: ReturnType<typeof userEvent.setup>) {
  fetchMock.mockResolvedValueOnce(response({ requiresVerification: true }));
  await submitCredentials(user);
  return screen.findByRole("textbox", { name: "Verification code" });
}

beforeEach(() => {
  state.mockMode = true;
  vi.stubGlobal("fetch", fetchMock);
});

describe("HomeSignIn component", () => {
  it("renders labeled inputs, required constraints and registration entry", () => {
    render(<HomeSignIn phone={phone} />);
    expect(screen.getByRole("heading", { name: "Sign in to your Account" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("type", "email");
    expect(screen.getByRole("textbox", { name: "Email" })).toBeRequired();
    expect(screen.getByLabelText("Password", { exact: true })).toBeRequired();
    expect(screen.getByLabelText("Password", { exact: true })).toHaveAttribute("type", "password");
    expect(screen.getByRole("link", { name: "Register Now" })).toHaveAttribute("href", "#register");
  });

  it("does not submit missing credentials or an invalid email", async () => {
    const user = userEvent.setup(); render(<HomeSignIn phone={phone} />);
    await user.click(screen.getByRole("button", { name: "Sign in to your Account" }));
    expect(fetchMock).not.toHaveBeenCalled();
    await user.type(screen.getByRole("textbox", { name: "Email" }), "invalid-email");
    await user.type(screen.getByLabelText("Password", { exact: true }), "password");
    await user.click(screen.getByRole("button", { name: "Sign in to your Account" }));
    expect(screen.getByRole("textbox", { name: "Email" })).toBeInvalid();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("toggles password visibility without submitting the form", async () => {
    const user = userEvent.setup(); render(<HomeSignIn phone={phone} />);
    const password = screen.getByLabelText("Password", { exact: true });
    await user.type(password, "keep-this-value");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text"); expect(password).toHaveValue("keep-this-value");
    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password"); expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts credentials and opens the mock verification form", async () => {
    const user = userEvent.setup(); render(<HomeSignIn phone={phone} />);
    const code = await enterVerification(user);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/sign-in", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "borrower@example.com", password: "BorrowerPassword123!" }),
    });
    expect(code).toHaveFocus(); expect(code).toHaveAttribute("autocomplete", "one-time-code");
    expect(screen.getByText(/Use the verification code provided by your project team/)).toBeInTheDocument();
    expect(state.push).not.toHaveBeenCalled();
  });

  it.each(["123", "abcdef"])("rejects invalid verification code %s before requesting", async value => {
    const user = userEvent.setup(); render(<HomeSignIn phone={phone} />);
    const code = await enterVerification(user); await user.type(code, value);
    await user.click(screen.getByRole("button", { name: "Verify and sign in" }));
    expect(code).toBeInvalid(); expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("submits a valid code and navigates only on a dashboard success", async () => {
    const user = userEvent.setup(); render(<HomeSignIn phone={phone} />);
    const code = await enterVerification(user);
    fetchMock.mockResolvedValueOnce(response({ redirectTo: "/dashboard" }));
    await user.type(code, "123456"); await user.click(screen.getByRole("button", { name: "Verify and sign in" }));
    await waitFor(() => expect(state.push).toHaveBeenCalledWith("/dashboard"));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/auth/verify", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: "123456" }),
    });
  });

  it("supports a direct successful sign-in response", async () => {
    const user = userEvent.setup(); fetchMock.mockResolvedValueOnce(response({ redirectTo: "/dashboard" }));
    render(<HomeSignIn phone={phone} />); await submitCredentials(user);
    await waitFor(() => expect(state.push).toHaveBeenCalledWith("/dashboard"));
  });

  it("does not navigate to an unrecognized server redirect", async () => {
    const user = userEvent.setup(); fetchMock.mockResolvedValueOnce(response({ redirectTo: "https://example.com" }));
    render(<HomeSignIn phone={phone} />); await submitCredentials(user);
    expect(state.push).not.toHaveBeenCalled();
  });

  it.each([
    [{ error: "Email or password is incorrect." }, "Email or password is incorrect."],
    [{}, "Sign-in failed. Please try again."],
  ])("displays credential errors and allows retry: %j", async (body, message) => {
    const user = userEvent.setup(); fetchMock.mockResolvedValueOnce(response(body, 401));
    render(<HomeSignIn phone={phone} />); await submitCredentials(user);
    expect(await screen.findByRole("status")).toHaveTextContent(message);
    expect(screen.getByRole("button", { name: "Sign in to your Account" })).toBeEnabled();
    expect(state.push).not.toHaveBeenCalled();
  });

  it("keeps verification available after a rejected code and clears errors on back", async () => {
    const user = userEvent.setup(); render(<HomeSignIn phone={phone} />);
    const code = await enterVerification(user); fetchMock.mockResolvedValueOnce(response({ error: "Invalid verification code." }, 401));
    await user.type(code, "000000"); await user.click(screen.getByRole("button", { name: "Verify and sign in" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Invalid verification code.");
    expect(code).toBeInTheDocument(); expect(state.push).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Back to sign in" }));
    expect(screen.getByLabelText("Password", { exact: true })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it.each(["network", "invalid JSON"])("shows contact guidance for %s failures", async failure => {
    const user = userEvent.setup();
    fetchMock.mockImplementationOnce(() => failure === "network" ? Promise.reject(new TypeError("Offline")) : Promise.resolve(new Response("not-json")));
    render(<HomeSignIn phone={phone} />); await submitCredentials(user);
    expect(await screen.findByRole("status")).toHaveTextContent(`We couldn't reach the server. Please try again, or call ${phone}.`);
    expect(state.push).not.toHaveBeenCalled();
  });

  it("disables sign-in while pending and prevents repeated clicks", async () => {
    const user = userEvent.setup(), pending = Promise.withResolvers<Response>();
    fetchMock.mockReturnValueOnce(pending.promise); render(<HomeSignIn phone={phone} />); await submitCredentials(user);
    const button = screen.getByRole("button", { name: /Signing in/ }); expect(button).toBeDisabled();
    await user.click(button); expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve(response({ error: "Try again." }, 503)));
    expect(await screen.findByRole("button", { name: "Sign in to your Account" })).toBeEnabled();
  });

  it("disables verification and Back while verifying", async () => {
    const user = userEvent.setup(); render(<HomeSignIn phone={phone} />); const code = await enterVerification(user);
    const pending = Promise.withResolvers<Response>(); fetchMock.mockReturnValueOnce(pending.promise);
    await user.type(code, "123456"); await user.click(screen.getByRole("button", { name: "Verify and sign in" }));
    expect(screen.getByRole("button", { name: /Verifying/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to sign in" })).toBeDisabled();
    await act(async () => pending.resolve(response({ redirectTo: "/dashboard" })));
    await waitFor(() => expect(state.push).toHaveBeenCalledOnce());
  });

  it.each([true, false])("shows appropriate recovery guidance in mock mode %s", async mode => {
    state.mockMode = mode; const user = userEvent.setup(); render(<HomeSignIn phone={phone} />);
    await user.click(screen.getByRole("button", { name: "Forgot password?" }));
    expect(screen.getByRole("heading", { name: "Account recovery" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Contact Customer Solutions/ })).toHaveAttribute("href", "tel:8772523761");
    expect(screen.getByText(mode ? /not connected in this preview/ : /approved RTR account-recovery process/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Back to sign in" }));
    expect(screen.getByLabelText("Password", { exact: true })).toBeInTheDocument();
  });

  it("does not start demo verification when the sign-in service is disconnected", async () => {
    state.mockMode = false; const user = userEvent.setup(); render(<HomeSignIn phone={phone} />);
    await submitCredentials(user);
    expect(screen.getByRole("status")).toHaveTextContent("The sign-in service is not connected.");
    expect(screen.queryByText(/Use the verification code provided by your project team/)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("opens registration from the initial hash and prefills the completed email", async () => {
    window.history.replaceState(null, "", "/#register"); const user = userEvent.setup();
    render(<HomeSignIn phone={phone} />);
    expect(await screen.findByRole("heading", { name: "Create your account" })).toBeInTheDocument();
    expect(screen.getByText(phone)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Complete registration" }));
    expect(await screen.findByRole("textbox", { name: "Email" })).toHaveValue("new.borrower@example.com");
    expect(screen.getByRole("status")).toHaveTextContent("Your account has been created.");
    expect(window.location.hash).toBe("#sign-in");
  });

  it("reacts to hash changes and removes its listener on unmount", async () => {
    const remove = vi.spyOn(window, "removeEventListener"); const { unmount } = render(<HomeSignIn phone={phone} />);
    act(() => { window.history.replaceState(null, "", "/#register"); fireEvent(window, new HashChangeEvent("hashchange")); });
    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
    act(() => { window.history.replaceState(null, "", "/#sign-in"); fireEvent(window, new HashChangeEvent("hashchange")); });
    expect(screen.getByRole("heading", { name: "Sign in to your Account" })).toBeInTheDocument();
    unmount(); expect(remove).toHaveBeenCalledWith("hashchange", expect.any(Function));
  });
});
