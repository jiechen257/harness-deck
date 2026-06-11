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
  it("renders the default Chinese practice operations workbench", () => {
    render(<App />);

    expect(screen.getByText("本地优先就绪")).toBeInTheDocument();
    expect(screen.getByLabelText("产品功能状态")).toBeInTheDocument();
    expect(screen.getAllByText("闭环状态总览").length).toBeGreaterThan(0);
    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    for (const label of ["首页", "实践库", "应用与同步", "本地评审", "运维", "设置"]) {
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
    expect(screen.getByText("Loop Status Overview")).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    for (const label of ["Home", "Practice Library", "Apply & Sync", "Local Review", "Operations", "Settings"]) {
      expect(within(navigation).getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("renders a standalone menu bar panel window from the Tauri panel URL", () => {
    window.history.pushState({}, "", "/?panel=1");
    render(<App />);

    expect(screen.getByText("打开工作台")).toBeInTheDocument();
    expect(screen.getByText("闭环健康度")).toBeInTheDocument();
    expect(screen.getByText("实践健康度")).toBeInTheDocument();
    expect(screen.getByText("本机运维")).toBeInTheDocument();
    expect(screen.getByText("快捷入口")).toBeInTheDocument();
    expect(screen.getByText("刷新信号")).toBeInTheDocument();
    expect(screen.getByText("打开本地评审")).toBeInTheDocument();
    expect(screen.getByText("打开应用与同步")).toBeInTheDocument();
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
    expect(within(navigation).getByRole("button", { name: "应用与同步" })).toHaveAttribute("aria-current", "page");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(within(navigation).getByRole("button", { name: "首页" })).toHaveAttribute("aria-current", "page");
  });

  it("navigates to Practice Library and shows signal pipeline", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "实践库" }));

    expect(within(navigation).getByRole("button", { name: "实践库" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("规范化预览")).toBeInTheDocument();
    expect(screen.getAllByText("刷新信号").length).toBeGreaterThan(0);
  });

  it("navigates to Apply & Sync view", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "应用与同步" }));

    expect(within(navigation).getByRole("button", { name: "应用与同步" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("注册表投射")).toBeInTheDocument();
  });

  it("confirms the Apply & Sync projection plan in browser fixture mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "应用与同步" }));

    const confirmButton = await screen.findByRole("button", { name: /确认投射/ });
    await user.click(confirmButton);

    expect(await screen.findByText("投射完成")).toBeInTheDocument();
  });

  it("shows adapter status and read-only diff in Apply & Sync", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "应用与同步" }));

    expect(await screen.findByText("Adapter Status")).toBeInTheDocument();
    await user.click((await screen.findAllByRole("button", { name: "查看差异" }))[0]);

    expect(await screen.findByText("只读 Diff")).toBeInTheDocument();
  });

  it("navigates to Local Review view", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "本地评审" }));

    expect(within(navigation).getByRole("button", { name: "本地评审" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("评审发现")).toBeInTheDocument();
  });

  it("navigates to Operations view", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "运维" }));

    expect(within(navigation).getByRole("button", { name: "运维" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("运行审计")).toBeInTheDocument();
  });

  it("keeps Operations preview-first and blocks ungranted script execution", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "运维" }));

    const previewButtons = screen.getAllByRole("button", { name: "预览计划" });
    await user.click(previewButtons[0]);
    await user.click(screen.getAllByRole("button", { name: "确认运行" })[0]);

    expect(screen.getByText("需要先在设置中授予脚本执行权限。菜单栏不会直接运行高风险脚本。")).toBeInTheDocument();
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
