import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "./App";

afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
  window.localStorage.clear();
});

describe("HarnessDeck app foundation", () => {
  it("renders the default Chinese workbench without prototype-only shell chrome", () => {
    render(<App />);

    expect(screen.queryByRole("heading", { name: "HarnessDeck 命令中心" })).not.toBeInTheDocument();
    expect(screen.queryByText("本地 Harness 工作台")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Brand navigation" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("菜单栏面板")).not.toBeInTheDocument();

    expect(screen.getByText("HarnessDeck 控制台")).toBeInTheDocument();
    expect(screen.getByText("产品工作流队列")).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    for (const label of ["首页", "配置", "同步", "运行", "洞察"]) {
      expect(within(navigation).getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(within(navigation).queryByRole("button", { name: "设置" })).not.toBeInTheDocument();
  });

  it("switches fixed UI copy to English", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByText("HarnessDeck Console")).toBeInTheDocument();
    expect(screen.getByText("Product workflow queue")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "HarnessDeck Command Center" })).not.toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    expect(within(navigation).getByRole("button", { name: "Configure" })).toBeInTheDocument();
    expect(screen.queryByText("Menu Bar Panel")).not.toBeInTheDocument();
  });

  it("renders a standalone menu bar panel window from the Tauri panel URL", () => {
    window.history.pushState({}, "", "/?panel=1");
    render(<App />);

    expect(screen.getByTestId("menu-panel-window")).toBeInTheDocument();
    expect(screen.getByText("菜单栏面板")).toBeInTheDocument();
    expect(screen.getByText("当前配置集")).toBeInTheDocument();
    expect(screen.getByText("同步健康度")).toBeInTheDocument();
    expect(screen.getByText("防睡")).toBeInTheDocument();
    expect(screen.getByText("搜索配置集、同步、账号")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "HarnessDeck 命令中心" })).not.toBeInTheDocument();
  });

  it("switches from the default light theme to dark", async () => {
    const user = userEvent.setup();
    render(<App />);

    const shell = screen.getByTestId("app-shell");
    expect(shell).toHaveAttribute("data-theme", "light");

    await user.click(screen.getByRole("button", { name: "深色" }));

    expect(shell).toHaveAttribute("data-theme", "dark");
  });

  it("uses native-feel keyboard and context-menu conventions", async () => {
    const user = userEvent.setup();
    render(<App />);

    const contextMenuEvent = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    document.dispatchEvent(contextMenuEvent);
    expect(contextMenuEvent.defaultPrevented).toBe(true);

    fireEvent.keyDown(window, { key: ",", metaKey: true });
    expect(await screen.findByText("Account Workspace")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "3", metaKey: true });
    expect(await screen.findByText("Deploy Plan")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    expect(within(navigation).getByRole("button", { name: "首页" })).toHaveAttribute("aria-current", "page");

    await user.tab();
    expect(document.activeElement).not.toBe(document.body);
  });

  it("renders fixture profiles and targets", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "配置" }));

    expect(await screen.findByRole("button", { name: /macOS Dev 配置集/ })).toBeInTheDocument();
    expect(screen.getByText("Codex fixture")).toBeInTheDocument();
    expect(screen.getByText("Claude Code fixture")).toBeInTheDocument();
  });

  it("generates a dry-run deploy plan and writes a visible manifest result", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "同步" }));

    expect(await screen.findByText("Deploy Plan")).toBeInTheDocument();
    expect(screen.getByText("append scoped rules block from Harness Profile rules")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "确认 dry-run" }));

    expect(await screen.findByText("dry-run manifest 已写入")).toBeInTheDocument();
    expect(screen.getByText("未触碰真实配置")).toBeInTheDocument();
  });

  it("shows sync governance diff conflicts drift and rollback preview", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "同步" }));

    expect(await screen.findByText("Three-way Diff")).toBeInTheDocument();
    expect(screen.getByText("Conflict Queue")).toBeInTheDocument();
    expect(screen.getByText("Drift Detection")).toBeInTheDocument();
    expect(screen.getByText("Rollback Preview")).toBeInTheDocument();
    expect(screen.getByText("local target rule overlaps with profile rule scope")).toBeInTheDocument();
    expect(screen.getByText("real write would create backup snapshot and rollback metadata before applying changes")).toBeInTheDocument();
  });

  it("discovers local targets only after explicit local read authorization", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "同步" }));

    expect(screen.getByText("本地读取未授权")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "授权读取本地 target" }));

    expect(await screen.findByText("Codex local target")).toBeInTheDocument();
    expect(screen.getByText("Claude Code local target")).toBeInTheDocument();
    expect(screen.getAllByText("raw config hidden").length).toBeGreaterThan(0);
  });

  it("renders usage and cost with source confidence labels", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "洞察" }));
    await user.click(await screen.findByRole("button", { name: "用量" }));

    expect(await screen.findByText("用量与成本")).toBeInTheDocument();
    expect(screen.getByText("$4.82")).toBeInTheDocument();
    expect(screen.getByText("LocalLog")).toBeInTheDocument();
    expect(screen.getAllByText("Estimated").length).toBeGreaterThan(0);
    expect(screen.getByText("Missing")).toBeInTheDocument();
    expect(screen.getByText("burn rate")).toBeInTheDocument();
  });

  it("renders account workspace with keychain references and no secret values", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "配置" }));
    await user.click(await screen.findByRole("button", { name: "设置" }));

    expect(await screen.findByText("Account Workspace")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("gpt-5-codex")).toBeInTheDocument();
    expect(screen.getByText("keychain://HarnessDeck/accounts/openai")).toBeInTheDocument();
    expect(screen.getByText("secret value hidden")).toBeInTheDocument();
    expect(screen.getByText("Switch-plan preview")).toBeInTheDocument();
    expect(screen.queryByText(/sk-/)).not.toBeInTheDocument();
  });

  it("renders guard policy with privacy keychain backup and real-write protection", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "同步" }));
    await user.click(await screen.findByRole("button", { name: "守护" }));

    expect(await screen.findByText("守护策略")).toBeInTheDocument();
    expect(screen.getByText("不上传 prompt、源码、密钥或本地配置")).toBeInTheDocument();
    expect(screen.getByText("keychain://HarnessDeck/accounts/openai")).toBeInTheDocument();
    expect(screen.getByText("backup required before real write")).toBeInTheDocument();
    expect(screen.getByText("real writes blocked")).toBeInTheDocument();
  });

  it("renders registry templates and find-best-skill scoring without remote discovery", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "配置" }));
    await user.click(await screen.findByRole("button", { name: "发现" }));

    expect(await screen.findByText("Registry 与 find-best-skill")).toBeInTheDocument();
    expect(screen.getByText("Tauri Desktop Guardrails")).toBeInTheDocument();
    expect(screen.getByText("safety risk: Low")).toBeInTheDocument();
    expect(screen.getByText("Remote call not performed")).toBeInTheDocument();
  });

  it("renders local insights and high-priority feed items", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "洞察" }));

    expect(await screen.findByText("洞察与 Feed")).toBeInTheDocument();
    expect(screen.getByText("Token anomaly")).toBeInTheDocument();
    expect(screen.getByText("Profile drift")).toBeInTheDocument();
    expect(screen.getByText("High priority")).toBeInTheDocument();
    expect(screen.getByText("profile impact")).toBeInTheDocument();
  });

  it("renders wake controls and requires confirmation for experimental lid-awake", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "运行" }));

    expect(await screen.findByText("Wake Control")).toBeInTheDocument();
    expect(screen.getByText("standard awake")).toBeInTheDocument();
    expect(screen.getByText("timed awake")).toBeInTheDocument();
    expect(screen.getByText("display sleep control")).toBeInTheDocument();
    expect(screen.getByText("experimental lid-awake")).toBeInTheDocument();
    expect(screen.getByText("需要显式确认")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "确认实验性合盖防睡" }));

    expect(await screen.findByText("experimental lid-awake confirmed (mock)")).toBeInTheDocument();
  });
});
