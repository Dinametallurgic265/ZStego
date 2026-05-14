use crate::{
    formats::image as img,
    state::AppState,
};
use anyhow::Result;
use serde::Serialize;
use tauri::State;

#[derive(Debug, Serialize)]
pub struct ChannelData {
    pub width: u32,
    pub height: u32,
    pub r: Vec<u8>,
    pub g: Vec<u8>,
    pub b: Vec<u8>,
    pub a: Vec<u8>,
    pub r_lsb: Vec<u8>,
    pub g_lsb: Vec<u8>,
    pub b_lsb: Vec<u8>,
    pub histograms: Vec<Vec<u64>>,
}

#[derive(Debug, Serialize)]
pub struct DiffData {
    pub width: u32,
    pub height: u32,
    pub diff_10x: String,
    pub diff_50x: String,
    pub diff_100x: String,
}

#[tauri::command]
pub async fn get_channel_data(
    path: String,
    _state: State<'_, AppState>,
) -> Result<ChannelData, String> {
    channel_inner(path).await.map_err(|e| e.to_string())
}

async fn channel_inner(path: String) -> Result<ChannelData> {
    let p = std::path::Path::new(&path);
    let image = img::load_rgba(p)?;
    let (w, h) = image.dimensions();
    let mut r = Vec::with_capacity((w * h) as usize);
    let mut g = Vec::with_capacity((w * h) as usize);
    let mut b = Vec::with_capacity((w * h) as usize);
    let mut a = Vec::with_capacity((w * h) as usize);
    let mut r_lsb = Vec::with_capacity((w * h) as usize);
    let mut g_lsb = Vec::with_capacity((w * h) as usize);
    let mut b_lsb = Vec::with_capacity((w * h) as usize);

    for px in image.pixels() {
        r.push(px[0]);
        g.push(px[1]);
        b.push(px[2]);
        a.push(px[3]);

        r_lsb.push((px[0] & 1) * 255);
        g_lsb.push((px[1] & 1) * 255);
        b_lsb.push((px[2] & 1) * 255);
    }

    let hists = img::channel_histograms(&image);
    let histograms = hists.iter().map(|h| h.to_vec()).collect();

    Ok(ChannelData { width: w, height: h, r, g, b, a, r_lsb, g_lsb, b_lsb, histograms })
}

#[tauri::command]
pub async fn get_diff_data(
    original_path: String,
    stego_path: String,
    _state: State<'_, AppState>,
) -> Result<DiffData, String> {
    diff_inner(original_path, stego_path).await.map_err(|e| e.to_string())
}

async fn diff_inner(original_path: String, stego_path: String) -> Result<DiffData> {
    let orig = img::load_rgba(std::path::Path::new(&original_path))?;
    let stego = img::load_rgba(std::path::Path::new(&stego_path))?;
    let (w, h) = orig.dimensions();

    let encode_png_b64 = |img: &image::RgbaImage| -> Result<String> {
        let mut buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut buf), image::ImageFormat::Png)?;
        Ok(base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &buf))
    };

    let diff10 = img::pixel_diff(&orig, &stego, 10)?;
    let diff50 = img::pixel_diff(&orig, &stego, 50)?;
    let diff100 = img::pixel_diff(&orig, &stego, 100)?;

    Ok(DiffData {
        width: w,
        height: h,
        diff_10x: encode_png_b64(&diff10)?,
        diff_50x: encode_png_b64(&diff50)?,
        diff_100x: encode_png_b64(&diff100)?,
    })
}
