import { borrowerMockMode } from "./mock-mode";

let redirecting = false;

export function returnToSignIn(reason: "expired" | "signed-out") {
  if (redirecting) return;
  redirecting = true;
  if (borrowerMockMode) sessionStorage.removeItem("rtr-mock-session-until");
  sessionStorage.setItem("rtr-auth-return", reason);
  window.location.replace("/");
}
