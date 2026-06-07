import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "./App";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("HarnessDeck app foundation", () => {
  it("renders the default Chinese workbench navigation and menu panel", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "HarnessDeck 工作台" })).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Workbench views" });
    for (const label of ["首页", "发现", "配置集", "同步", "运行", "用量", "洞察", "守护", "设置"]) {
      expect(within(navigation).getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByText("菜单栏面板")).toBeInTheDocument();
    expect(screen.getByText("当前配置集")).toBeInTheDocument();
    expect(screen.getByText("同步状态")).toBeInTheDocument();
    expect(screen.getByText("5 小时成本")).toBeInTheDocument();
    expect(screen.getByText("防睡状态")).toBeInTheDocument();
  });

  it("switches fixed UI copy to English", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByRole("heading", { name: "HarnessDeck Workbench" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Profiles/ })).toBeInTheDocument();
    expect(screen.getByText("Menu Bar Panel")).toBeInTheDocument();
  });

  it("switches from the default light theme to dark", async () => {
    const user = userEvent.setup();
    render(<App />);

    const shell = screen.getByTestId("app-shell");
    expect(shell).toHaveAttribute("data-theme", "light");

    await user.click(screen.getByRole("button", { name: "深色" }));

    expect(shell).toHaveAttribute("data-theme", "dark");
  });
});
