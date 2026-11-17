"use client";

import { createContext, useContext } from "react";

export type PortalRequest = (url: string, body: unknown) => Promise<Response>;
export const PortalRequestContext = createContext<PortalRequest>((url, body) => fetch(url, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
}));
export const usePortalRequest = () => useContext(PortalRequestContext);
