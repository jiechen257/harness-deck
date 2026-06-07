pub mod commands;
pub mod domain;
pub mod services;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
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
      let open = MenuItem::with_id(app, "open_workbench", "Open Workbench", true, None::<&str>)?;
      let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
      let tray_menu = Menu::with_items(app, &[&open, &quit])?;
      let mut tray_builder = TrayIconBuilder::new()
        .tooltip("HarnessDeck")
        .menu(&tray_menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
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
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
