import { describe, expect, it } from "vitest";

import { DefaultExecutor } from "../../open-sse/executors/default.js";

describe("Kilo public free transport", () => {
  const executor = new DefaultExecutor("kilocode");

  it("uses the public gateway and Bearer public for a virtual free connection", () => {
    const credentials = {
      accessToken: "public",
      providerSpecificData: { publicAccess: true },
    };

    expect(executor.buildUrl("stepfun/step-3.7-flash:free", false, 0, credentials))
      .toBe("https://api.kilo.ai/api/gateway/v1/chat/completions");
    expect(executor.buildHeaders(credentials, false, undefined, "stepfun/step-3.7-flash:free"))
      .toMatchObject({ Authorization: "Bearer public" });
  });

  it("preserves the OAuth endpoint and token for normal Kilo models", () => {
    const credentials = {
      accessToken: "oauth-token",
      providerSpecificData: { orgId: "org-1" },
    };

    expect(executor.buildUrl("deepseek/deepseek-v4-flash", false, 0, credentials))
      .toBe("https://api.kilo.ai/api/openrouter/chat/completions");
    expect(executor.buildHeaders(credentials, false, undefined, "deepseek/deepseek-v4-flash"))
      .toMatchObject({
        Authorization: "Bearer oauth-token",
        "X-Kilocode-OrganizationID": "org-1",
      });
  });
});
