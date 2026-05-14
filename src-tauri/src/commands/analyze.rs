use crate::{
    formats::{image as img, wav, CarrierFormat},
    header::{AlgoId, CryptoId, PayloadHeader, HEADER_SIZE},
    stego::lsb::LsbEngine,
    stego::StegoEngine,
    state::AppState,
};
use anyhow::Result;
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine as _;
use serde::Serialize;
use tauri::State;

#[derive(Debug, Serialize)]
pub struct CarrierInfo {
    pub format: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub sample_count: Option<u64>,
    pub sample_rate: Option<u32>,
    pub capacity_1bit: u64,
    pub capacity_2bit: u64,
    pub capacity_4bit: u64,
    pub thumbnail: Option<String>,
}

#[tauri::command]
pub async fn analyze_carrier(
    path: String,
    _state: State<'_, AppState>,
) -> Result<CarrierInfo, String> {
    analyze_inner(path).await.map_err(|e| e.to_string())
}


#[derive(Debug, Serialize)]
pub struct HeaderPeek {
    pub algo: String,
    pub encryption: String,
    pub lsb_bits: u8,
    pub payload_size: u64,
}

#[tauri::command]
pub fn peek_header(path: String) -> Result<HeaderPeek, String> {
    peek_header_inner(path).map_err(|e| e.to_string())
}

fn peek_header_inner(path: String) -> Result<HeaderPeek> {
    let p = std::path::Path::new(&path);
    let format = CarrierFormat::detect(p)?;
    let raw: Vec<u8> = if format.is_image() {
        let image = img::load_rgba(p)?;
        img::to_raw_rgba(&image)
    } else {
        let wav_data = wav::load_wav(p)?;
        wav_data.samples.iter().flat_map(|&s| (s as i16).to_le_bytes()).collect()
    };
    let engine = LsbEngine::new(1, None);
    let header_bytes = engine.extract(&raw, HEADER_SIZE)?;
    let header = PayloadHeader::from_bytes(&header_bytes)?;
    let algo = match header.algo {
        AlgoId::Lsb    => "LSB",
        AlgoId::Dct    => "DCT",
        AlgoId::Phase  => "Phase Coding",
        AlgoId::Echo   => "Echo Hiding",
        AlgoId::Spread => "Spread Spectrum",
    }.to_string();
    let encryption = match header.crypto {
        CryptoId::AesGcm => "AES-256-GCM",
        CryptoId::ChaCha => "ChaCha20-Poly1305",
    }.to_string();
    Ok(HeaderPeek { algo, encryption, lsb_bits: header.lsb_bits, payload_size: header.payload_size })
}


#[derive(Debug, Serialize)]
pub struct FilePreview {
    pub kind: String,
    pub data: String,
}

#[tauri::command]
pub fn read_preview(path: String) -> Result<FilePreview, String> {
    read_preview_inner(path).map_err(|e| e.to_string())
}

fn read_preview_inner(path: String) -> Result<FilePreview> {
    let p = std::path::Path::new(&path);
    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let bytes = std::fs::read(p).map_err(anyhow::Error::from)?;
    let image_exts = ["png", "jpg", "jpeg", "bmp", "gif", "webp"];
    if image_exts.contains(&ext.as_str()) {
        return Ok(FilePreview { kind: "image".into(), data: B64.encode(&bytes) });
    }
    if let Ok(text) = std::str::from_utf8(&bytes) {
        let preview = if text.len() > 8192 { &text[..8192] } else { text };
        return Ok(FilePreview { kind: "text".into(), data: preview.to_string() });
    }
    let hex_bytes = &bytes[..bytes.len().min(128)];
    let hex = hex_bytes.iter().map(|b| format!("{:02x}", b)).collect::<Vec<_>>().join(" ");
    Ok(FilePreview { kind: "hex".into(), data: hex })
}


async fn analyze_inner(path: String) -> Result<CarrierInfo> {
    let p = std::path::Path::new(&path);
    let format = CarrierFormat::detect(p)?;

    if format.is_image() {
        let image = img::load_rgba(p)?;
        let raw_len = (image.width() * image.height() * 4) as usize;
        let cap1 = LsbEngine::new(1, None).capacity(raw_len) as u64;
        let cap2 = LsbEngine::new(2, None).capacity(raw_len) as u64;
        let cap4 = LsbEngine::new(4, None).capacity(raw_len) as u64;
        let thumb = img::thumbnail_base64(p).ok();
        Ok(CarrierInfo {
            format: format!("{:?}", format).to_lowercase(),
            width: Some(image.width()),
            height: Some(image.height()),
            sample_count: None,
            sample_rate: None,
            capacity_1bit: cap1,
            capacity_2bit: cap2,
            capacity_4bit: cap4,
            thumbnail: thumb,
        })
    } else if matches!(format, CarrierFormat::Wav) {
        let wav_data = wav::load_wav(p)?;
        let raw_len = wav_data.samples.len() * 2;
        let cap1 = LsbEngine::new(1, None).capacity(raw_len) as u64;
        let cap2 = LsbEngine::new(2, None).capacity(raw_len) as u64;
        let cap4 = LsbEngine::new(4, None).capacity(raw_len) as u64;
        Ok(CarrierInfo {
            format: "wav".into(),
            width: None,
            height: None,
            sample_count: Some(wav_data.samples.len() as u64),
            sample_rate: Some(wav_data.spec.sample_rate),
            capacity_1bit: cap1,
            capacity_2bit: cap2,
            capacity_4bit: cap4,
            thumbnail: None,
        })
    } else {

        let audio = crate::formats::audio_decode::decode_audio(p)?;
        let raw_len = audio.samples.len() * 4;
        let cap1 = LsbEngine::new(1, None).capacity(raw_len) as u64;
        let cap2 = LsbEngine::new(2, None).capacity(raw_len) as u64;
        let cap4 = LsbEngine::new(4, None).capacity(raw_len) as u64;
        Ok(CarrierInfo {
            format: format!("{:?}", format).to_lowercase(),
            width: None,
            height: None,
            sample_count: Some(audio.samples.len() as u64),
            sample_rate: Some(audio.sample_rate),
            capacity_1bit: cap1,
            capacity_2bit: cap2,
            capacity_4bit: cap4,
            thumbnail: None,
        })
    }
}
