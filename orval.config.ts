import { defineConfig } from "orval";

export default defineConfig({
  portal: {
    input: "./source-docs/api/borrower-portal-api.openapi.yaml",
    output: {
      target: "./lib/api/generated/portal.ts",
      schemas: "./lib/api/generated/model",
      mode: "tags-split",
      client: "react-query",
      httpClient: "fetch",
      baseUrl: "/api/v1",
      urlEncodeParameters: true,
      mock: { generators: [{ type: "msw", useExamples: true, delay: false, baseUrl: "/api/v1" }] },
      override: {
        mutator: { path: "./lib/api/http.ts", name: "portalHttp" },
        fetch: { includeHttpResponseReturnType: false },
        query: { useSuspenseQuery: false },
      },
    },
  },
});
