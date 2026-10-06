import { beforeEach, describe, expect, it, vi } from "vitest";

const localDb = vi.hoisted(() => ({
  getProviderConnections: vi.fn(),
  getCombos: vi.fn(),
  getCustomModels: vi.fn(),
  getModelAliases: vi.fn(),
}));

vi.mock("@/lib/localDb", () => localDb);
vi.mock("@/lib/disabledModelsDb", () => ({ getDisabledModels: vi.fn(async () => ({})) }));

import { buildModelsList, clearNoAuthModelCache } from "../../src/app/api/v1/models/route.js";

describe("/v1/models live no-auth catalogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearNoAuthModelCache();
    localDb.getCombos.mockResolvedValue([]);
    localDb.getCustomModels.mockResolvedValue([]);
    localDb.getModelAliases.mockResolvedValue({});
  });

  it("uses live OpenCode free models for a healthy empty database", async () => {
    localDb.getProviderConnections.mockResolvedValue([]);
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (url === "https://opencode.ai/zen/v1/models") {
        return new Response(JSON.stringify({
          data: [
            { id: "deepseek-live-free" },
            { id: "paid-placeholder" },
            { id: "big-pickle" },
          ],
        }));
      }
      if (url === "https://api.kilo.ai/api/gateway/models") {
        return new Response(JSON.stringify({ data: [] }));
      }
      throw new Error(`unexpected URL: ${url}`);
    }));

    const models = await buildModelsList(["llm"]);
    const ids = models.map((model) => model.id);

    expect(ids).toEqual(["oc/deepseek-live-free", "oc/big-pickle"]);
    expect(ids).not.toContain("oc/paid-placeholder");
    expect(ids.length).toBeLessThan(10);
  });

  it("exposes only live Kilo :free models without an OAuth connection", async () => {
    localDb.getProviderConnections.mockResolvedValue([]);
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (url === "https://api.kilo.ai/api/gateway/models") {
        return new Response(JSON.stringify({
          data: [
            { id: "stepfun/step-3.7-flash:free", name: "Step Free" },
            { id: "poolside/laguna-s-2.1:free", name: "Laguna Free" },
            { id: "deepseek/deepseek-v4-flash", name: "DeepSeek Paid" },
          ],
        }));
      }
      return new Response(JSON.stringify({ data: [] }));
    }));

    const ids = (await buildModelsList(["llm"])).map((model) => model.id);

    expect(ids).toContain("kc/stepfun/step-3.7-flash:free");
    expect(ids).toContain("kc/poolside/laguna-s-2.1:free");
    expect(ids).not.toContain("kc/deepseek/deepseek-v4-flash");
  });

  it("merges the live OpenCode catalog for an active connection with no curated models", async () => {
    localDb.getProviderConnections.mockResolvedValue([{
      id: "opencode-1",
      provider: "opencode",
      isActive: true,
      providerSpecificData: { prefix: "my-oc", enabledModels: [] },
    }]);
    vi.stubGlobal("fetch", vi.fn(async (url) => new Response(JSON.stringify({
      data: url === "https://opencode.ai/zen/v1/models"
        ? [{ id: "active-live-free" }, { id: "paid-placeholder" }]
        : [],
    }))));

    const models = await buildModelsList(["llm"]);
    const ids = models.map((model) => model.id);

    expect(ids).toContain("my-oc/active-live-free");
    expect(ids).not.toContain("my-oc/paid-placeholder");
  });

  it("keeps the static catalog only when the provider database is unavailable", async () => {
    localDb.getProviderConnections.mockRejectedValue(new Error("database unavailable"));
    vi.stubGlobal("fetch", vi.fn());

    const models = await buildModelsList(["llm"]);
    const ids = models.map((model) => model.id);

    expect(ids.length).toBeGreaterThan(100);
    expect(ids).toContain("alicode-intl/qwen3.5-plus");
    expect(fetch).not.toHaveBeenCalled();
  });
});
