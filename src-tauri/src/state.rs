use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub default_algorithm: String,
    pub default_encryption: String,
    pub output_directory: Option<String>,
    pub strip_exif: bool,
    pub theme: String,
    pub font_size: u8,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            default_algorithm: "lsb".into(),
            default_encryption: "aes-gcm".into(),
            output_directory: None,
            strip_exif: true,
            theme: "dark".into(),
            font_size: 14,
        }
    }
}

#[derive(Default)]
pub struct AppState {
    pub settings: Mutex<AppSettings>,
}
