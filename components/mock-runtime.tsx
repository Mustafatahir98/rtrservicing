"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from "@tanstack/react-query";
import { PortalRequestContext } from "./portal-request";
import { retryPortalQuery } from "@/api/http";
import { borrowerMockMode } from "@/lib/mock-mode";
import { executePortalAction } from "@/api/portal-actions";
import { waitForMockWorker } from "@/lib/mock-worker-ready";

function MockRequests({ children }: { children: React.ReactNode }) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ url, body }: { url: string; body: unknown }) => executePortalAction(url, body),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["borrower-mock"] }); await client.invalidateQueries({ queryKey: ["/api/v1/me"] }); },
    retry: false,
  });
  return <PortalRequestContext value={(url, body) => mutation.mutateAsync({ url, body })}>{children}</PortalRequestContext>;
}

export default function MockRuntime({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState("");
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: {
    staleTime: 30_000,
    retry: retryPortalQuery,
  } } }));
  useEffect(() => {
    if (!borrowerMockMode) return;
    let mounted = true;
    waitForMockWorker().catch(() => {
      if (mounted) setError("Mock service could not start. Use localhost or the HTTPS ngrok URL, then reload.");
    });
    return () => { mounted = false; };
  }, []);
  if (error) return <main role="alert"><p>{error}</p><button onClick={() => window.location.reload()}>Reload demo</button></main>;
  return <QueryClientProvider client={client}><MockRequests>
    {children}
  </MockRequests></QueryClientProvider>;
}
