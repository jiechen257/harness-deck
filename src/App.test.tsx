import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "./App";

afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
  window.localStorage.clear();
});

describe("Hone app foundation", () => {
  it("renders the default Chinese workbench with 5 nav items", () => {
    render(<App />);

    expect(screen.getByText("本地优先就绪")).toBeInTheDocument();
    expect(screen.getByLabelText("产品功能状态")).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    for (const label of ["首页", "发现", "用量", "洞察", "设置"]) {
      expect(within(navigation).getByRole("button", { name: label })).toBeInTheDocument();
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
    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    for (const label of ["Home", "Discover", "Usage", "Insights", "Settings"]) {
      expect(within(navigation).getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("renders a standalone menu bar panel window from the Tauri panel URL", () => {
    window.history.pushState({}, "", "/?panel=1");
    render(<App />);

    expect(screen.getByTestId("menu-panel-window")).toBeInTheDocument();
    expect(screen.getByText("菜单栏面板")).toBeInTheDocument();
    expect(screen.getByText("当前配置集")).toBeInTheDocument();
    expect(screen.getByText("搜索配置集、同步、账号")).toBeInTheDocument();
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

  it("navigates to Discover view", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "发现" }));

    expect(await screen.findByText("发现 AI Coding 范式")).toBeInTheDocument();
    expect(screen.getByText("更新热榜")).toBeInTheDocument();
    expect(screen.getByText("已安装 Skills")).toBeInTheDocument();
  });

  it("navigates to Usage view", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "用量" }));

    expect(await screen.findByText("用量与成本")).toBeInTheDocument();
  });

  it("renders insights and feed items", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "洞察" }));

    expect(await screen.findByText("洞察与优化")).toBeInTheDocument();
    expect(screen.getByText("高优先")).toBeInTheDocument();
    expect(screen.getByText("配置集影响")).toBeInTheDocument();
  });

  it("renders Settings with tabs for absorbed views", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "设置" }));

    expect(await screen.findByText("账户工作区")).toBeInTheDocument();

    const tabNav = screen.getByRole("navigation", { name: "Settings sections" });
    for (const tab of ["通用", "已安装", "同步", "守护", "防睡"]) {
      expect(within(tabNav).getByRole("button", { name: tab })).toBeInTheDocument();
    }
  });

  it("Settings Installed tab shows profiles and targets", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "设置" }));

    await user.click(await screen.findByRole("button", { name: "已安装" }));

    expect(await screen.findByText("配置集")).toBeInTheDocument();
    expect(screen.getByText("Codex fixture")).toBeInTheDocument();
  });

  it("Settings Guard tab shows guard policy", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "设置" }));

    await user.click(await screen.findByRole("button", { name: "守护" }));

    expect(await screen.findByText("守护策略")).toBeInTheDocument();
    expect(screen.getByText("真实写入已关闭")).toBeInTheDocument();
  });

  it("Settings Wake tab shows wake controls and experimental confirmation", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "设置" }));

    await user.click(await screen.findByRole("button", { name: "防睡" }));

    expect(await screen.findByText("防睡控制")).toBeInTheDocument();
    expect(screen.getByText("需要显式确认")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "确认实验性合盖防睡" }));

    expect(await screen.findByText("实验性合盖唤醒已确认（模拟）")).toBeInTheDocument();
  });

  it("shows Hone branding in About menu", async () => {
    const user = userEvent.setup();
    render(<App />);

    const brandBtn = screen.getByRole("button", { expanded: false });
    await user.click(brandBtn);

    expect(screen.getByRole("menuitem", { name: "关于 Hone" })).toBeInTheDocument();
  });
});
