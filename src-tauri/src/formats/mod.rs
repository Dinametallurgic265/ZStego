pub mod audio_decode;
pub mod image;
pub mod wav;

use anyhow::{bail, Result};
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CarrierFormat {
    Png,
    Bmp,
    Jpeg,
    Wav,
    Flac,
    Mp3,
}

impl CarrierFormat {
    pub fn detect(path: &Path) -> Result<Self> {
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_ascii_lowercase());
        match ext.as_deref() {
            Some("png") => Ok(Self::Png),
            Some("bmp") => Ok(Self::Bmp),
            Some("jpg") | Some("jpeg") => Ok(Self::Jpeg),
            Some("wav") => Ok(Self::Wav),
            Some("flac") => Ok(Self::Flac),
            Some("mp3") => Ok(Self::Mp3),
            other => bail!("unsupported carrier format: {:?}", other),
        }
    }

    pub fn is_image(&self) -> bool {
        matches!(self, Self::Png | Self::Bmp | Self::Jpeg)
    }
}
