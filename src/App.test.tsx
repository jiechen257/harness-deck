import { invoke } from "@tauri-apps/api/core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
  window.localStorage.clear();
  delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  vi.mocked(invoke).mockReset();
});

describe("Hone app foundation", () => {
  it("renders the README workbench views in Chinese", () => {
    render(<App />);

    expect(screen.getByText("本地优先就绪")).toBeInTheDocument();
    expect(screen.getByLabelText("产品功能状态")).toBeInTheDocument();
    expect(screen.getAllByText("闭环状态总览").length).toBeGreaterThan(0);
    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    for (const label of ["首页", "发现", "用量", "洞察", "设置"]) {
      expect(within(navigation).getByRole("button", { name: label })).toBeInTheDocument();
    }
    for (const oldLabel of ["实践库", "应用与同步", "本地评审", "运维"]) {
      expect(within(navigation).queryByRole("button", { name: oldLabel })).not.toBeInTheDocument();
    }
  });

  it("switches fixed UI copy to English", async () => {
    const user = userEvent.setup();
    render(<App />);

    const brandBtn = screen.getByRole("button", { expanded: false });
    await user.click(brandBtn);
    await user.click(screen.getByRole("menuitem", { name: "切换到 English" }));

    expect(screen.getByText("Local-first ready")).toBeInTheDocument();
    expect(screen.getByLabelText("Product function status")).toBeInTheDocument();
    expect(screen.getByText("Loop Status Overview")).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    for (const label of ["Home", "Discover", "Usage", "Insights", "Settings"]) {
      expect(within(navigation).getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("renders a standalone menu bar panel window from the Tauri panel URL", () => {
    window.history.pushState({}, "", "/?panel=1");
    render(<App />);

    expect(screen.getByText("打开工作台")).toBeInTheDocument();
    expect(screen.getByText("闭环健康度")).toBeInTheDocument();
    expect(screen.getByText("实践健康度")).toBeInTheDocument();
    expect(screen.getByText("本地用量")).toBeInTheDocument();
    expect(screen.getByText("快捷入口")).toBeInTheDocument();
    expect(screen.getByText("刷新信号")).toBeInTheDocument();
    expect(screen.getByText("打开洞察")).toBeInTheDocument();
    expect(screen.getByText("预览投射计划")).toBeInTheDocument();
  });

  it("switches from the default light theme to dark", async () => {
    const user = userEvent.setup();
    render(<App />);

    const shell = screen.getByTestId("app-shell");
    expect(shell).toHaveAttribute("data-theme", "light");

    const brandBtn = screen.getByRole("button", { expanded: false });
    await user.click(brandBtn);
    await user.click(screen.getByRole("menuitem", { name: "深色模式" }));

    expect(shell).toHaveAttribute("data-theme", "dark");
  });

  it("uses native-feel keyboard shortcuts", async () => {
    render(<App />);

    fireEvent.keyDown(window, { key: ",", metaKey: true });
    expect(await screen.findByText("通用")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "3", metaKey: true });
    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    expect(within(navigation).getByRole("button", { name: "用量" })).toHaveAttribute("aria-current", "page");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(within(navigation).getByRole("button", { name: "首页" })).toHaveAttribute("aria-current", "page");
  });

  it("navigates to Discover and shows signal pipeline", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "发现" }));

    expect(within(navigation).getByRole("button", { name: "发现" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("规范化预览")).toBeInTheDocument();
    expect(screen.getAllByText("刷新信号").length).toBeGreaterThan(0);
  });

  it("navigates to Usage and Insights as README primary views", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "用量" }));
    expect(await screen.findByText("用量与成本")).toBeInTheDocument();
    expect(within(navigation).getByRole("button", { name: "用量" })).toHaveAttribute("aria-current", "page");

    await user.click(within(navigation).getByRole("button", { name: "洞察" }));
    expect(await screen.findByRole("heading", { name: /用量洞察/ })).toBeInTheDocument();
    expect(within(navigation).getByRole("button", { name: "洞察" })).toHaveAttribute("aria-current", "page");
  });

  it("completes the Discover signal to asset user flow", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "发现" }));

    await user.click(await screen.findByRole("button", { name: "生成实践预览" }));
    const generatedTitle = await screen.findByText("Codex Desktop 1.19.0 practice agent profile loading");
    expect(generatedTitle).toBeInTheDocument();
    expect(screen.queryByText("操作未完成")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "保存为实践" }));
    const practiceTitle = await screen.findByText("Codex Desktop 1.19.0 practice agent profile loading");
    const practiceCard = practiceTitle.closest("article");
    expect(practiceCard).not.toBeNull();

    await user.click(within(practiceCard as HTMLElement).getByRole("button", { name: "创建本地资产" }));
    expect(await screen.findByText("profiles/codex-desktop-1-19-0-practice-agent-profile-loading.md")).toBeInTheDocument();
  });

  it("sends the Discover user flow through Tauri commands with Codex", async () => {
    const now = new Date().toISOString();
    const signal = {
      id: "codex-changelog",
      title: "Codex changelog updates agent profile loading",
      sourceUrl: "https://example.com/codex",
      sourceTier: "official",
      signalType: "changelog",
      impact: "high",
      confidence: "confirmed",
      excerpt: "Profile loading and runtime assembly changed.",
      publishedAt: now,
      fetchedAt: now,
      status: "inbox",
      createdAt: now,
      updatedAt: now,
    };
    const draft = {
      title: "Profile loading practice",
      practiceType: "workflow",
      summary: "Keep agent profile loading changes synchronized.",
      scenarios: ["Generate a practice preview from a changelog signal"],
      comparable: ["Manual release-note tracking"],
      canGenerateAsset: true,
      suggestedAssetTypes: ["skill"],
    };
    const practice = {
      id: "practice-profile-loading",
      title: draft.title,
      practiceType: draft.practiceType,
      summary: draft.summary,
      scenarios: JSON.stringify(draft.scenarios),
      comparable: JSON.stringify(draft.comparable),
      applicability: "can_generate_asset",
      generatedBy: "normalize-practice-card",
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    const asset = {
      id: "asset-profile-loading",
      practiceId: practice.id,
      assetType: "agent_profile_fragment",
      registryPath: "profiles/profile-loading-practice.md",
      checksum: null,
      isSystem: false,
      status: "ready",
      createdAt: now,
      updatedAt: now,
    };
    let practices: typeof practice[] = [];
    let assets: typeof asset[] = [];

    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    vi.mocked(invoke).mockImplementation(async (cmd: string, args?: unknown) => {
      if (cmd === "get_app_status") {
        return { appName: "Hone", version: "0.2.0", localeDefault: "zh-CN", themeDefault: "light", fixtureMode: false, realWritesEnabled: false, phase: "test", healthScore: 82, healthFactors: [] };
      }
      if (cmd === "get_loop_summary") {
        return { healthScore: 82, sections: [], decisions: [], targets: [], recentAudits: [], updatedAt: now, fixtureMode: false };
      }
      if (cmd === "list_signal_sources") {
        return [{ id: "codex-changelog", name: "Codex changelog", sourceType: "changelog", sourceTier: "official", url: "https://example.com/codex", enabled: true, autoRefresh: false, updatedAt: now }];
      }
      if (cmd === "list_signals") return [signal];
      if (cmd === "list_practices") return practices;
      if (cmd === "list_local_assets") return assets;
      if (cmd === "normalize_signal") {
        expect(args).toEqual({ signalId: signal.id, agentKind: "Codex" });
        return { signalId: signal.id, success: true, draft, errorCode: null, errorMessage: null, durationMs: 12 };
      }
      if (cmd === "create_practice_from_signal") {
        expect(args).toEqual({ signalId: signal.id, draft });
        practices = [practice];
        return practice;
      }
      if (cmd === "create_local_asset_from_practice") {
        expect(args).toEqual({ practiceId: practice.id, assetType: "agent_profile_fragment", registryPath: asset.registryPath, isSystem: false });
        assets = [asset];
        return asset;
      }
      return undefined;
    });

    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "发现" }));
    await user.click(await screen.findByRole("button", { name: "生成实践预览" }));
    expect(await screen.findByText("Profile loading practice")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "保存为实践" }));
    const practiceCard = (await screen.findAllByText("Profile loading practice"))
      .map((element) => element.closest("article"))
      .find((article): article is HTMLElement => Boolean(article?.querySelector("button")));
    if (!practiceCard) throw new Error("practice article not found");
    await user.click(within(practiceCard).getByRole("button", { name: "创建本地资产" }));

    expect((await screen.findAllByText("profiles/profile-loading-practice.md")).length).toBeGreaterThan(0);
    expect(vi.mocked(invoke)).toHaveBeenCalledWith("normalize_signal", { signalId: signal.id, agentKind: "Codex" });
  });

  it("renders Settings with authorization and audit tabs", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "设置" }));

    expect(await screen.findByText("通用")).toBeInTheDocument();
    expect(screen.getByText("授权")).toBeInTheDocument();
    expect(screen.getByText("审计")).toBeInTheDocument();
    expect(screen.getByText("Registry Bootstrap")).toBeInTheDocument();
  });

  it("shows Hone branding in About menu", async () => {
    const user = userEvent.setup();
    render(<App />);

    const brandBtn = screen.getByRole("button", { expanded: false });
    await user.click(brandBtn);

    expect(screen.getByRole("menuitem", { name: "关于 Hone" })).toBeInTheDocument();
  });
});
