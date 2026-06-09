pub mod commands;
pub mod domain;
pub mod readers;
pub mod services;

#[cfg(test)]
mod byoa_tests;
#[cfg(test)]
mod phase1_tests;
#[cfg(test)]
mod phase2_3_tests;
#[cfg(test)]
mod phase4_5_tests;
#[cfg(test)]
mod phase6_8_tests;

use tauri::menu::{Menu, MenuBuilder, MenuItem, SubmenuBuilder};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, PhysicalPosition, Rect, Runtime};

fn show_menu_panel<R: Runtime>(app: &AppHandle<R>, anchor: Option<&Rect>) {
  if let Some(window) = app.get_webview_window("menubar") {
    if let Some(rect) = anchor {
      let position = rect.position.to_physical::<i32>(1.0);
      let size = rect.size.to_physical::<i32>(1.0);
      let x = position.x + size.width - 356;
      let y = position.y + size.height + 6;
      let _ = window.set_position(PhysicalPosition::new(x.max(0), y.max(0)));
    }
    let _ = window.show();
    let _ = window.set_focus();
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .on_window_event(|window, event| {
      if window.label() == "menubar" {
        if let tauri::WindowEvent::Focused(false) = event {
          let _ = window.hide();
        }
      }
    })
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      let app_paths = services::app_paths::paths_for_app(app.handle())?;
      app_paths.ensure()?;

      let app_submenu = SubmenuBuilder::new(app, "HarnessDeck")
        .about(None)
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;
      let edit_submenu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;
      let app_menu = MenuBuilder::new(app)
        .item(&app_submenu)
        .item(&edit_submenu)
        .build()?;
      app.set_menu(app_menu)?;

      let panel = MenuItem::with_id(app, "open_menu_panel", "Open Menu Panel", true, None::<&str>)?;
      let open = MenuItem::with_id(app, "open_workbench", "Open Workbench", true, None::<&str>)?;
      let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
      let tray_menu = Menu::with_items(app, &[&panel, &open, &quit])?;
      let mut tray_builder = TrayIconBuilder::new()
        .tooltip("HarnessDeck")
        .menu(&tray_menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
          if let TrayIconEvent::Click {
            button: MouseButton::Left,
            rect,
            ..
          } = event
          {
            show_menu_panel(tray.app_handle(), Some(&rect));
          }
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
          "open_menu_panel" => {
            show_menu_panel(app, None);
          }
          "open_workbench" => {
            if let Some(window) = app.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
          "quit" => app.exit(0),
          _ => {}
        });

      if let Some(icon) = app.default_window_icon() {
        tray_builder = tray_builder.icon(icon.clone());
      }

      tray_builder.build(app)?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::app_commands::get_app_status,
      commands::app_commands::get_app_paths,
      commands::app_commands::open_workbench,
      commands::profile_commands::list_profiles,
      commands::profile_commands::get_profile,
      commands::profile_commands::validate_profile_command,
      commands::target_commands::list_targets,
      commands::target_commands::discover_targets,
      commands::account_commands::get_account_workspace,
      commands::account_commands::preview_account_switch,
      commands::registry_commands::list_registry_templates,
      commands::registry_commands::list_local_skills,
      commands::registry_commands::find_best_skill,
      commands::insight_commands::list_insights,
      commands::insight_commands::list_feed_items,
      commands::insight_commands::list_high_priority_feed,
      commands::wake_commands::get_wake_control,
      commands::wake_commands::request_wake_mode_command,
      commands::deploy_commands::generate_deploy_plan,
      commands::deploy_commands::confirm_dry_run_deploy,
      commands::deploy_commands::get_latest_manifest,
      commands::deploy_commands::get_sync_governance,
      commands::usage_commands::get_usage_summary,
      commands::usage_commands::get_real_usage_summary,
      commands::insight_commands::list_real_insights,
      commands::byoa_commands::detect_agents,
      commands::byoa_commands::invoke_agent,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
