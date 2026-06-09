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

    expect(screen.getByText("安全同步就绪")).toBeInTheDocument();
    expect(screen.getByLabelText("产品功能状态")).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    for (const label of ["首页", "配置", "同步", "运行", "洞察"]) {
      expect(within(navigation).getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(within(navigation).queryByRole("button", { name: "设置" })).not.toBeInTheDocument();
  });

  it("switches fixed UI copy to English", async () => {
    const user = userEvent.setup();
    render(<App />);

    const brandBtn = screen.getByRole("button", { expanded: false });
    await user.click(brandBtn);
    await user.click(screen.getByRole("menuitem", { name: "切换到 English" }));

    expect(screen.getByText("Safe sync ready")).toBeInTheDocument();
    expect(screen.getByLabelText("Product function status")).toBeInTheDocument();
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

    const brandBtn = screen.getByRole("button", { expanded: false });
    await user.click(brandBtn);
    await user.click(screen.getByRole("menuitem", { name: "深色模式" }));

    expect(shell).toHaveAttribute("data-theme", "dark");
  });

  it("uses native-feel keyboard and context-menu conventions", async () => {
    const user = userEvent.setup();
    render(<App />);

    const contextMenuEvent = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    document.dispatchEvent(contextMenuEvent);
    expect(contextMenuEvent.defaultPrevented).toBe(true);

    fireEvent.keyDown(window, { key: ",", metaKey: true });
    expect(await screen.findByText("账户工作区")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "3", metaKey: true });
    expect(await screen.findByText("部署计划")).toBeInTheDocument();

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

    expect(await screen.findByText("部署计划")).toBeInTheDocument();
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

    expect(await screen.findByText("三路对比")).toBeInTheDocument();
    expect(screen.getByText("冲突队列")).toBeInTheDocument();
    expect(screen.getByText("漂移检测")).toBeInTheDocument();
    expect(screen.getByText("回滚预览")).toBeInTheDocument();
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
    expect(screen.getAllByText("原始配置已隐藏").length).toBeGreaterThan(0);
  });

  it("renders usage and cost with source confidence labels", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "洞察" }));
    await user.click(await screen.findByRole("button", { name: "用量" }));

    expect(await screen.findByText("用量与成本")).toBeInTheDocument();
    expect(screen.getByText("$4.82")).toBeInTheDocument();
    expect(screen.getByText("本地日志")).toBeInTheDocument();
    expect(screen.getAllByText("估算").length).toBeGreaterThan(0);
    expect(screen.getByText("缺失")).toBeInTheDocument();
    expect(screen.getByText("burn rate")).toBeInTheDocument();
  });

  it("renders account workspace with keychain references and no secret values", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "配置" }));
    await user.click(await screen.findByRole("button", { name: "设置" }));

    expect(await screen.findByText("账户工作区")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("gpt-5-codex")).toBeInTheDocument();
    expect(screen.getByText("keychain://HarnessDeck/accounts/openai")).toBeInTheDocument();
    expect(screen.getByText("密钥值已隐藏")).toBeInTheDocument();
    expect(screen.getByText("切换计划预览")).toBeInTheDocument();
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
    expect(screen.getByText("真实写入前必须备份")).toBeInTheDocument();
    expect(screen.getByText("真实写入已关闭")).toBeInTheDocument();
  });

  it("renders local skills and find-best-skill scoring without remote discovery", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "配置" }));
    await user.click(await screen.findByRole("button", { name: "发现" }));

    expect(await screen.findByText("注册表与技能推荐")).toBeInTheDocument();
    expect(screen.getByText("Tauri Desktop Guardrails")).toBeInTheDocument();
    expect(screen.getByText("Prompt Ops Privacy Review")).toBeInTheDocument();
    expect(screen.getByText("Experimental Hook Runner")).toBeInTheDocument();
    expect(screen.getAllByText("Claude Code").length).toBeGreaterThan(0);
    expect(screen.getByText("Codex")).toBeInTheDocument();
    expect(screen.getByText("未执行远程调用")).toBeInTheDocument();
  });

  it("renders local insights and high-priority feed items", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "洞察" }));

    expect(await screen.findByText("洞察与 Feed")).toBeInTheDocument();
    expect(screen.getByText("Token 用量异常")).toBeInTheDocument();
    expect(screen.getByText("配置集漂移")).toBeInTheDocument();
    expect(screen.getByText("高优先")).toBeInTheDocument();
    expect(screen.getByText("配置集影响")).toBeInTheDocument();
  });

  it("renders wake controls and requires confirmation for experimental lid-awake", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "运行" }));

    expect(await screen.findByText("防睡控制")).toBeInTheDocument();
    expect(screen.getByText("标准唤醒")).toBeInTheDocument();
    expect(screen.getByText("定时唤醒")).toBeInTheDocument();
    expect(screen.getByText("显示器休眠控制")).toBeInTheDocument();
    expect(screen.getByText("实验性合盖唤醒")).toBeInTheDocument();
    expect(screen.getByText("需要显式确认")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "确认实验性合盖防睡" }));

    expect(await screen.findByText("实验性合盖唤醒已确认（模拟）")).toBeInTheDocument();
  });
});
