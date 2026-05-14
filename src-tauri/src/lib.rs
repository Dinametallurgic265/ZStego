mod commands;
mod crypto;
mod formats;
mod header;
mod state;
mod stego;

use commands::{analyze, decode, encode, preview, settings, testbench};
use analyze::{peek_header, read_preview};
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            encode::encode_file,
            encode::write_temp_text,
            decode::decode_file,
            analyze::analyze_carrier,
            peek_header,
            read_preview,
            preview::get_channel_data,
            preview::get_diff_data,
            settings::get_settings,
            settings::set_settings,
            settings::get_file_size,
            testbench::create_temp_path,
            testbench::read_text_file,
            testbench::remove_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
