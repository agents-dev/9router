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
      expect(url).toBe("https://opencode.ai/zen/v1/models");
      return new Response(JSON.stringify({
        data: [
          { id: "deepseek-live-free" },
          { id: "paid-placeholder" },
          { id: "big-pickle" },
        ],
      }));
    }));

    const models = await buildModelsList(["llm"]);
    const ids = models.map((model) => model.id);

    expect(ids).toEqual(["oc/deepseek-live-free", "oc/big-pickle"]);
    expect(ids).not.toContain("oc/paid-placeholder");
    expect(ids.length).toBeLessThan(10);
  });

  it("merges the live OpenCode catalog for an active connection with no curated models", async () => {
    localDb.getProviderConnections.mockResolvedValue([{
      id: "opencode-1",
      provider: "opencode",
      isActive: true,
      providerSpecificData: { prefix: "my-oc", enabledModels: [] },
    }]);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      data: [{ id: "active-live-free" }, { id: "paid-placeholder" }],
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
