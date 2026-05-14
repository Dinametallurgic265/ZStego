use super::StegoEngine;
use anyhow::{bail, Result};
use std::f64::consts::PI;


#[allow(dead_code)]
pub struct PhaseEngine {
    pub segment_len: usize,
}

#[allow(dead_code)]
impl PhaseEngine {
    pub fn new(segment_len: usize) -> Self {
        Self { segment_len }
    }

    fn dft(samples: &[f64]) -> Vec<(f64, f64)> {
        let n = samples.len();
        (0..n).map(|k| {
            let (mut re, mut im) = (0.0f64, 0.0f64);
            for (t, &s) in samples.iter().enumerate() {
                let angle = 2.0 * PI * k as f64 * t as f64 / n as f64;
                re += s * angle.cos();
                im -= s * angle.sin();
            }
            (re, im)
        }).collect()
    }

    fn idft(freqs: &[(f64, f64)]) -> Vec<f64> {
        let n = freqs.len();
        (0..n).map(|t| {
            let sum: f64 = freqs.iter().enumerate().map(|(k, &(re, im))| {
                let angle = 2.0 * PI * k as f64 * t as f64 / n as f64;
                re * angle.cos() - im * angle.sin()
            }).sum();
            sum / n as f64
        }).collect()
    }
}

impl StegoEngine for PhaseEngine {
    fn capacity(&self, carrier_len: usize) -> usize {
        let samples = carrier_len / 2;
        let segments = samples / self.segment_len;
        segments * self.segment_len / 2 / 8
    }

    fn embed(&self, carrier: &[u8], payload: &[u8]) -> Result<Vec<u8>> {
        if carrier.len() % 2 != 0 {
            bail!("phase engine requires i16 PCM (even byte count)");
        }
        let mut samples: Vec<f64> = carrier
            .chunks_exact(2)
            .map(|b| i16::from_le_bytes([b[0], b[1]]) as f64)
            .collect();

        let bits: Vec<u8> = payload.iter()
            .flat_map(|&b| (0..8).rev().map(move |i| (b >> i) & 1))
            .collect();

        let mut bit_idx = 0;
        let mut seg_start = 0;

        while seg_start + self.segment_len <= samples.len() && bit_idx < bits.len() {
            let seg = &samples[seg_start..seg_start + self.segment_len];
            let mut freqs = Self::dft(seg);
            let half = self.segment_len / 2;
            for k in 1..=half {
                if bit_idx >= bits.len() { break; }
                let (re, im) = freqs[k];
                let mag = (re * re + im * im).sqrt();
                let new_phase = if bits[bit_idx] == 1 { PI / 2.0 } else { -PI / 2.0 };
                freqs[k] = (mag * new_phase.cos(), mag * new_phase.sin());

                let mir = self.segment_len - k;
                freqs[mir] = (freqs[k].0, -freqs[k].1);
                bit_idx += 1;
            }
            let reconstructed = Self::idft(&freqs);
            for (i, &v) in reconstructed.iter().enumerate() {
                samples[seg_start + i] = v;
            }
            seg_start += self.segment_len;
        }

        let out: Vec<u8> = samples.iter()
            .flat_map(|&s| (s.round() as i16).to_le_bytes())
            .collect();
        Ok(out)
    }

    fn extract(&self, carrier: &[u8], payload_len: usize) -> Result<Vec<u8>> {
        if carrier.len() % 2 != 0 {
            bail!("phase engine requires i16 PCM (even byte count)");
        }
        let samples: Vec<f64> = carrier
            .chunks_exact(2)
            .map(|b| i16::from_le_bytes([b[0], b[1]]) as f64)
            .collect();

        let total_bits = payload_len * 8;
        let mut bits: Vec<u8> = Vec::with_capacity(total_bits);
        let mut seg_start = 0;

        while seg_start + self.segment_len <= samples.len() && bits.len() < total_bits {
            let seg = &samples[seg_start..seg_start + self.segment_len];
            let freqs = Self::dft(seg);
            let half = self.segment_len / 2;
            for k in 1..=half {
                if bits.len() >= total_bits { break; }
                let (re, im) = freqs[k];
                let phase = im.atan2(re);
                bits.push(if phase >= 0.0 { 1 } else { 0 });
            }
            seg_start += self.segment_len;
        }

        let payload: Vec<u8> = bits.chunks(8)
            .map(|chunk| chunk.iter().enumerate().fold(0u8, |acc, (i, &b)| acc | (b << (7 - i))))
            .collect();
        Ok(payload)
    }
}
