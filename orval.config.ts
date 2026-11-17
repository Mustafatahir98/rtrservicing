import { defineConfig } from "orval";

export default defineConfig({
  portal: {
    input: "./source-docs/api/borrower-portal-api.openapi.yaml",
    output: {
      target: "./api/generated/portal.ts",
      schemas: "./api/generated/model",
      mode: "tags-split",
      client: "react-query",
      httpClient: "fetch",
      baseUrl: "/api/v1",
      urlEncodeParameters: true,
      mock: { generators: [{ type: "msw", useExamples: true, delay: false, baseUrl: "/api/v1" }] },
      override: {
        mutator: { path: "./api/http.ts", name: "portalHttp" },
        fetch: { includeHttpResponseReturnType: false },
        query: { useSuspenseQuery: false },
      },
    },
  },
});
