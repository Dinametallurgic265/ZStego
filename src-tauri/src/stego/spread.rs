use super::StegoEngine;
use anyhow::{bail, Result};
use rand::SeedableRng as _;
use rand::Rng;


#[allow(dead_code)]
pub struct SpreadEngine {
    pub seed: u64,
    pub amplitude: f64,
    pub chip_rate: usize,
}

#[allow(dead_code)]
impl SpreadEngine {
    pub fn new(seed: u64, amplitude: f64, chip_rate: usize) -> Self {
        Self { seed, amplitude, chip_rate }
    }

    fn pn_sequence(&self, len: usize) -> Vec<i8> {
        let mut rng = rand::rngs::SmallRng::seed_from_u64(self.seed);
        (0..len).map(|_| if rng.gen::<bool>() { 1i8 } else { -1i8 }).collect()
    }
}

impl StegoEngine for SpreadEngine {
    fn capacity(&self, carrier_len: usize) -> usize {
        carrier_len / self.chip_rate / 8
    }

    fn embed(&self, carrier: &[u8], payload: &[u8]) -> Result<Vec<u8>> {
        let cap = self.capacity(carrier.len());
        if payload.len() > cap {
            bail!("payload exceeds spread-spectrum capacity ({cap} bytes)");
        }
        let bits: Vec<i8> = payload.iter()
            .flat_map(|&b| (0..8u8).rev().map(move |i| if (b >> i) & 1 == 1 { 1i8 } else { -1i8 }))
            .collect();

        let pn = self.pn_sequence(carrier.len());
        let mut out: Vec<f64> = carrier.iter().map(|&b| b as f64).collect();

        for (bit_idx, &bit) in bits.iter().enumerate() {
            let start = bit_idx * self.chip_rate;
            let end = (start + self.chip_rate).min(carrier.len());
            for i in start..end {
                out[i] += self.amplitude * bit as f64 * pn[i] as f64;
            }
        }

        Ok(out.iter().map(|&v| v.clamp(0.0, 255.0).round() as u8).collect())
    }

    fn extract(&self, carrier: &[u8], payload_len: usize) -> Result<Vec<u8>> {
        let pn = self.pn_sequence(carrier.len());
        let total_bits = payload_len * 8;
        let mut bits: Vec<u8> = Vec::with_capacity(total_bits);

        for bit_idx in 0..total_bits {
            let start = bit_idx * self.chip_rate;
            let end = (start + self.chip_rate).min(carrier.len());

            let correlation: f64 = (start..end)
                .map(|i| (carrier[i] as f64 - 128.0) * pn[i] as f64)
                .sum();
            bits.push(if correlation > 0.0 { 1 } else { 0 });
        }

        let payload: Vec<u8> = bits.chunks(8)
            .map(|chunk| chunk.iter().enumerate().fold(0u8, |acc, (i, &b)| acc | (b << (7 - i))))
            .collect();
        Ok(payload)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip() {
        let carrier = vec![128u8; 4096];
        let payload = b"SS";
        let eng = SpreadEngine::new(42, 8.0, 64);
        let stego = eng.embed(&carrier, payload).unwrap();
        let out = eng.extract(&stego, payload.len()).unwrap();
        assert_eq!(out, payload);
    }
}
