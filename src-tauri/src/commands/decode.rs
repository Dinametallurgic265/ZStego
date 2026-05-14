use crate::{
    crypto::{aes_gcm::AesGcmCipher, chacha::ChaChaCipher, derive_key, Cipher},
    formats::{image as img, wav, CarrierFormat},
    header::{CryptoId, PayloadHeader, HEADER_SIZE},
    stego::{lsb::LsbEngine, StegoEngine},
    state::AppState,
};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Deserialize)]
pub struct DecodeOptions {
    pub carrier_path: String,
    pub output_path: String,
    pub password: String,
    pub shuffle_seed: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct DecodeResult {
    pub output_path: String,
    pub original_size: u64,
    pub algorithm: String,
    pub encryption: String,
}

#[tauri::command]
pub async fn decode_file(
    opts: DecodeOptions,
    _state: State<'_, AppState>,
) -> Result<DecodeResult, String> {
    decode_inner(opts).await.map_err(|e| e.to_string())
}

async fn decode_inner(opts: DecodeOptions) -> Result<DecodeResult> {
    let carrier_path = std::path::Path::new(&opts.carrier_path);
    let format = CarrierFormat::detect(carrier_path)?;


    let raw = if format.is_image() {
        let img = img::load_rgba(carrier_path)?;
        img::to_raw_rgba(&img)
    } else {
        let wav_data = wav::load_wav(carrier_path)?;
        wav_data.samples.iter().flat_map(|&s| (s as i16).to_le_bytes()).collect()
    };


    let header_engine = LsbEngine::new(1, opts.shuffle_seed);
    let header_bytes  = header_engine.extract(&raw, HEADER_SIZE)?;
    let header        = PayloadHeader::from_bytes(&header_bytes)?;


    let header_channel_count = HEADER_SIZE * 8;
    let ciphertext_engine = LsbEngine::new(header.lsb_bits, opts.shuffle_seed);
    let ciphertext_len    = header.payload_size as usize + 16;
    let ciphertext = ciphertext_engine.extract_at_offset(&raw, ciphertext_len, header_channel_count)?;


    let key = derive_key(&opts.password, &header.salt)?;
    let cipher: Box<dyn Cipher> = match header.crypto {
        CryptoId::AesGcm => Box::new(AesGcmCipher::new(&key)),
        CryptoId::ChaCha => Box::new(ChaChaCipher::new(&key)),
    };
    let compressed = cipher.decrypt(&header.nonce, &ciphertext)?;


    let plaintext = zstd::decode_all(compressed.as_slice())?;
    let original_size = plaintext.len() as u64;


    std::fs::write(&opts.output_path, &plaintext)?;

    Ok(DecodeResult {
        output_path: opts.output_path,
        original_size,
        algorithm: format!("{:?}", header.algo).to_lowercase(),
        encryption: format!("{:?}", header.crypto).to_lowercase(),
    })
}
