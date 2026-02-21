// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn sync_to_device(source: String, destination: String, delete: bool) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut args = vec![
            "-r",
            "--ignore-existing",
            "--no-perms",
            "--no-owner",
            "--no-group",
            "--size-only",
        ];
        if delete {
            args.push("--delete");
        }
        let src = format!("{}/", source);
        args.push(&src);
        args.push(&destination);
        let output = std::process::Command::new("rsync")
            .args(&args)
            .output()
            .map_err(|e| e.to_string())?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet, sync_to_device])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
