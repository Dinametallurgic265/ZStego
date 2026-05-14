use anyhow::Result;
use hound::{SampleFormat, WavReader, WavSpec, WavWriter};
use std::path::Path;

pub struct WavData {
    pub spec: WavSpec,
    pub samples: Vec<i32>,
}

pub fn load_wav(path: &Path) -> Result<WavData> {
    let mut reader = WavReader::open(path)?;
    let spec = reader.spec();
    let samples: Vec<i32> = match spec.sample_format {
        SampleFormat::Int => reader.samples::<i32>().map(|s| Ok(s?)).collect::<Result<_>>()?,
        SampleFormat::Float => reader
            .samples::<f32>()
            .map(|s| Ok((s? * i32::MAX as f32) as i32))
            .collect::<Result<_>>()?,
    };
    Ok(WavData { spec, samples })
}

pub fn save_wav(data: &WavData, path: &Path) -> Result<()> {
    let mut writer = WavWriter::create(path, data.spec)?;
    match data.spec.sample_format {
        SampleFormat::Int => {
            for &s in &data.samples {
                writer.write_sample(s)?;
            }
        }
        SampleFormat::Float => {
            for &s in &data.samples {
                writer.write_sample(s as f32 / i32::MAX as f32)?;
            }
        }
    }
    writer.finalize()?;
    Ok(())
}

