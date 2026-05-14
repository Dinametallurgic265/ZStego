use crate::{
    crypto::{aes_gcm::AesGcmCipher, chacha::ChaChaCipher, derive_key, Cipher},
    formats::{image as img, wav, CarrierFormat},
    header::{AlgoId, CryptoId, PayloadHeader, HEADER_SIZE},
    stego::{lsb::LsbEngine, StegoEngine},
    state::AppState,
};
use anyhow::Result;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use tauri::State;

#[tauri::command]
pub fn write_temp_text(content: String) -> Result<String, String> {
    let mut id_bytes = [0u8; 4];
    rand::thread_rng().fill_bytes(&mut id_bytes);
    let id = u32::from_le_bytes(id_bytes);
    let path = std::env::temp_dir().join(format!("zstego_{:08x}.txt", id));
    std::fs::write(&path, content.as_bytes()).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

#[derive(Debug, Deserialize)]
pub struct EncodeOptions {
    pub carrier_path: String,
    pub payload_path: String,
    pub output_path: String,
    pub algorithm: String,
    pub encryption: String,
    pub password: String,
    pub lsb_bits: u8,
    pub shuffle_seed: Option<u64>,
    pub strip_exif: bool,
}

#[derive(Debug, Serialize)]
pub struct EncodeResult {
    pub output_path: String,
    pub payload_bytes: u64,
    pub capacity_bytes: u64,
    pub capacity_used_pct: f32,
}

#[tauri::command]
pub async fn encode_file(
    opts: EncodeOptions,
    _state: State<'_, AppState>,
) -> Result<EncodeResult, String> {
    encode_inner(opts).await.map_err(|e| e.to_string())
}

async fn encode_inner(opts: EncodeOptions) -> Result<EncodeResult> {

    let payload_raw = std::fs::read(&opts.payload_path)?;


    let payload_compressed = zstd::encode_all(payload_raw.as_slice(), 3)?;


    let mut salt = [0u8; 16];
    let mut nonce = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut salt);
    rand::thread_rng().fill_bytes(&mut nonce);


    let key = derive_key(&opts.password, &salt)?;
    let crypto_id = match opts.encryption.as_str() {
        "chacha20" => CryptoId::ChaCha,
        _ => CryptoId::AesGcm,
    };
    let cipher: Box<dyn Cipher> = match crypto_id {
        CryptoId::AesGcm => Box::new(AesGcmCipher::new(&key)),
        CryptoId::ChaCha => Box::new(ChaChaCipher::new(&key)),
    };
    let ciphertext = cipher.encrypt(&nonce, &payload_compressed)?;


    let algo_id = match opts.algorithm.as_str() {
        "dct"    => AlgoId::Dct,
        "phase"  => AlgoId::Phase,
        "echo"   => AlgoId::Echo,
        "spread" => AlgoId::Spread,
        _        => AlgoId::Lsb,
    };
    let header = PayloadHeader::new(algo_id, crypto_id, opts.lsb_bits, salt, nonce, payload_compressed.len() as u64);
    let header_bytes = header.to_bytes();


    let header_channel_count = HEADER_SIZE * 8;


    let carrier_path = std::path::Path::new(&opts.carrier_path);
    let output_path  = std::path::Path::new(&opts.output_path);
    let format = CarrierFormat::detect(carrier_path)?;

    let (capacity_bytes, output_path_str) = if format.is_image() {
        if opts.strip_exif {
            img::strip_metadata(carrier_path, output_path)?;
        }
        let img = img::load_rgba(carrier_path)?;
        let raw = img::to_raw_rgba(&img);


        let header_engine = LsbEngine::new(1, opts.shuffle_seed);
        let stego_raw = header_engine.embed(&raw, &header_bytes)?;


        let payload_engine = LsbEngine::new(opts.lsb_bits, opts.shuffle_seed);
        let stego_raw = payload_engine.embed_at_offset(&stego_raw, &ciphertext, header_channel_count)?;

        let payload_channels = raw.len().saturating_sub(header_channel_count);
        let cap = (payload_channels * opts.lsb_bits as usize) / 8;

        let stego_img = img::from_raw_rgba(stego_raw, img.width(), img.height())?;
        img::save_png(&stego_img, output_path)?;
        (cap as u64, opts.output_path.clone())
    } else {
        let wav_data = wav::load_wav(carrier_path)?;
        let raw: Vec<u8> = wav_data.samples.iter().flat_map(|&s| (s as i16).to_le_bytes()).collect();

        let header_engine = LsbEngine::new(1, opts.shuffle_seed);
        let stego_raw = header_engine.embed(&raw, &header_bytes)?;

        let payload_engine = LsbEngine::new(opts.lsb_bits, opts.shuffle_seed);
        let stego_raw = payload_engine.embed_at_offset(&stego_raw, &ciphertext, header_channel_count)?;

        let payload_channels = raw.len().saturating_sub(header_channel_count);
        let cap = (payload_channels * opts.lsb_bits as usize) / 8;

        let stego_samples: Vec<i32> = stego_raw.chunks_exact(2)
            .map(|b| i16::from_le_bytes([b[0], b[1]]) as i32)
            .collect();
        let stego_wav = wav::WavData { spec: wav_data.spec, samples: stego_samples };
        wav::save_wav(&stego_wav, output_path)?;
        (cap as u64, opts.output_path.clone())
    };

    let used_pct = ciphertext.len() as f32 / capacity_bytes as f32 * 100.0;
    Ok(EncodeResult {
        output_path: output_path_str,
        payload_bytes: ciphertext.len() as u64,
        capacity_bytes,
        capacity_used_pct: used_pct,
    })
}
