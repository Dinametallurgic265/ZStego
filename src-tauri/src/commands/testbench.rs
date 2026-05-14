use rand::RngCore;


#[tauri::command]
pub fn create_temp_path(ext: String) -> String {
    let mut id_bytes = [0u8; 4];
    rand::thread_rng().fill_bytes(&mut id_bytes);
    let id = u32::from_le_bytes(id_bytes);
    let path = std::env::temp_dir().join(format!("zstego_tb_{:08x}.{}", id, ext));
    path.to_string_lossy().into_owned()
}


#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}


#[tauri::command]
pub fn remove_file(path: String) -> Result<(), String> {
    match std::fs::remove_file(&path) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
