pub mod commands;
pub mod db;
pub mod domain;
pub mod readers;
pub mod services;

#[cfg(test)]
mod db_tests;
#[cfg(test)]
mod intake_tests;
#[cfg(test)]
mod loop_tests;
#[cfg(test)]
mod projection_tests;
#[cfg(test)]
mod skill_tests;

use tauri::menu::{Menu, MenuBuilder, MenuItem, SubmenuBuilder};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, PhysicalPosition, Rect, Runtime};
use tauri_plugin_positioner::{Position, WindowExt};

const TRAY_TEMPLATE_ICON: tauri::image::Image<'_> =
    tauri::include_image!("icons/tray-template.png");

fn show_menu_panel<R: Runtime>(app: &AppHandle<R>, anchor: Option<&Rect>) {
    if let Some(window) = app.get_webview_window("menubar") {
        if anchor.is_some()
            && window
                .move_window_constrained(Position::TrayBottomCenter)
                .is_ok()
        {
            let _ = window.show();
            let _ = window.set_focus();
            return;
        }

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
        .plugin(tauri_plugin_positioner::init())
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

            let database = db::Database::open(&app_paths.db).expect("failed to open hone database");
            database
                .seed_authorization()
                .expect("failed to seed authorization state");
            services::intake_service::seed_default_sources(&database)
                .expect("failed to seed default sources");
            app.manage(std::sync::Mutex::new(database));

            let app_submenu = SubmenuBuilder::new(app, "Hone")
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

            let panel = MenuItem::with_id(
                app,
                "open_menu_panel",
                "Open Menu Panel",
                true,
                None::<&str>,
            )?;
            let open =
                MenuItem::with_id(app, "open_workbench", "Open Workbench", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&panel, &open, &quit])?;
            let tray_builder = TrayIconBuilder::new()
                .icon(TRAY_TEMPLATE_ICON)
                .icon_as_template(true)
                .tooltip("Hone")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
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

            tray_builder.build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::app_commands::get_app_status,
            commands::app_commands::open_workbench,
            commands::usage_commands::get_real_usage_summary,
            commands::insight_commands::list_real_insights,
            commands::byoa_commands::detect_agents,
            commands::byoa_commands::invoke_agent,
            commands::db_commands::get_authorization_state,
            commands::db_commands::grant_authorization,
            commands::db_commands::revoke_authorization,
            commands::db_commands::get_active_registry,
            commands::db_commands::set_registry_connection,
            commands::db_commands::detect_registry_candidates,
            commands::db_commands::initialize_registry,
            commands::db_commands::use_starter_registry_readonly,
            commands::db_commands::list_signals,
            commands::db_commands::list_audit_events,
            commands::loop_commands::list_practices,
            commands::loop_commands::list_local_assets,
            commands::loop_commands::get_loop_summary,
            commands::loop_commands::normalize_signal,
            commands::loop_commands::create_practice_from_signal,
            commands::loop_commands::create_local_asset_from_practice,
            commands::skill_commands::list_system_skills,
            commands::skill_commands::execute_system_skill,
            commands::skill_commands::toggle_system_skill,
            commands::projection_commands::list_projection_targets,
            commands::projection_commands::list_adapter_capabilities,
            commands::projection_commands::list_projections,
            commands::projection_commands::list_drift_timeline,
            commands::projection_commands::preview_asset_diff,
            commands::projection_commands::preview_projection,
            commands::projection_commands::confirm_projection,
            commands::projection_commands::adopt_asset,
            commands::projection_commands::rollback_projection,
            commands::projection_commands::check_projection_health,
            commands::intake_commands::refresh_signals,
            commands::intake_commands::list_signal_sources,
            commands::intake_commands::toggle_signal_source,
            commands::intake_commands::toggle_auto_refresh,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
