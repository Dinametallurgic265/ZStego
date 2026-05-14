use crate::state::{AppSettings, AppState};
use tauri::State;

#[tauri::command]
pub fn get_file_size(path: String) -> Result<u64, String> {
    std::fs::metadata(&path)
        .map(|m| m.len())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> AppSettings {
    state.settings.lock().unwrap().clone()
}

#[tauri::command]
pub fn set_settings(settings: AppSettings, state: State<'_, AppState>) {
    *state.settings.lock().unwrap() = settings;
}
