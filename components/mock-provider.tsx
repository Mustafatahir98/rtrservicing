"use client";

import MockRuntime from "./mock-runtime";
export default function MockProvider({ children }: { children: React.ReactNode }) {
  return <MockRuntime>{children}</MockRuntime>;
}
