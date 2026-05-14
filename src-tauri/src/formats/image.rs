use anyhow::Result;
use image::{ImageBuffer, Rgba, RgbaImage};
use std::path::Path;

pub fn load_rgba(path: &Path) -> Result<RgbaImage> {
    let img = image::open(path)?;
    Ok(img.to_rgba8())
}

pub fn save_png(img: &RgbaImage, path: &Path) -> Result<()> {
    img.save(path)?;
    Ok(())
}


pub fn to_raw_rgba(img: &RgbaImage) -> Vec<u8> {
    img.as_raw().clone()
}


pub fn from_raw_rgba(bytes: Vec<u8>, width: u32, height: u32) -> Result<RgbaImage> {
    ImageBuffer::from_raw(width, height, bytes)
        .ok_or_else(|| anyhow::anyhow!("failed to create image from raw bytes"))
}


pub fn strip_metadata(path: &Path, out_path: &Path) -> Result<()> {
    let img = image::open(path)?;
    img.save(out_path)?;
    Ok(())
}


pub fn thumbnail_base64(path: &Path) -> Result<String> {
    let img = image::open(path)?;
    let thumb = img.thumbnail(200, 200);
    let mut buf = Vec::new();
    thumb.write_to(&mut std::io::Cursor::new(&mut buf), image::ImageFormat::Png)?;
    Ok(base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &buf))
}


pub fn channel_histograms(img: &RgbaImage) -> [[u64; 256]; 4] {
    let mut hists = [[0u64; 256]; 4];
    for px in img.pixels() {
        for (c, &v) in px.0.iter().enumerate() {
            hists[c][v as usize] += 1;
        }
    }
    hists
}


pub fn pixel_diff(a: &RgbaImage, b: &RgbaImage, amplify: u8) -> Result<RgbaImage> {
    anyhow::ensure!(
        a.dimensions() == b.dimensions(),
        "images must have the same dimensions for diff"
    );
    let (w, h) = a.dimensions();
    let mut out: RgbaImage = ImageBuffer::new(w, h);
    for (x, y, px_a) in a.enumerate_pixels() {
        let px_b = b.get_pixel(x, y);
        let r = ((px_a[0] as i16 - px_b[0] as i16).unsigned_abs() as u32 * amplify as u32).min(255) as u8;
        let g = ((px_a[1] as i16 - px_b[1] as i16).unsigned_abs() as u32 * amplify as u32).min(255) as u8;
        let b_ch = ((px_a[2] as i16 - px_b[2] as i16).unsigned_abs() as u32 * amplify as u32).min(255) as u8;
        out.put_pixel(x, y, Rgba([r, g, b_ch, 255]));
    }
    Ok(out)
}
