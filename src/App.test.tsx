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

    expect(screen.getByText("打开工作台")).toBeInTheDocument();
    expect(screen.getByText("刷新状态")).toBeInTheDocument();
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

  it("navigates to Discover view and shows signal sources", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "发现" }));

    expect(await screen.findByText("信号源")).toBeInTheDocument();
    expect(screen.getByText("刷新全部")).toBeInTheDocument();
  });

  it("navigates to Usage view", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "用量" }));

    expect(await screen.findByText("用量与成本")).toBeInTheDocument();
  });

  it("navigates to Insights view", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "洞察" }));

    expect(await screen.findByText("洞察与评审")).toBeInTheDocument();
  });

  it("renders Settings with authorization and audit tabs", async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    await user.click(within(navigation).getByRole("button", { name: "设置" }));

    expect(await screen.findByText("通用")).toBeInTheDocument();
    expect(screen.getByText("授权")).toBeInTheDocument();
    expect(screen.getByText("审计")).toBeInTheDocument();
  });

  it("shows Hone branding in About menu", async () => {
    const user = userEvent.setup();
    render(<App />);

    const brandBtn = screen.getByRole("button", { expanded: false });
    await user.click(brandBtn);

    expect(screen.getByRole("menuitem", { name: "关于 Hone" })).toBeInTheDocument();
  });
});
