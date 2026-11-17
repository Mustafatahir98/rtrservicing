// Explicit opt-in for synthetic borrower demos. Never infer this from a missing DB.
export const borrowerMockMode = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

export class MockApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
