use super::StegoEngine;
use anyhow::{bail, Result};


#[allow(dead_code)]
pub struct EchoEngine {
    pub block_len: usize,
    pub delay_zero: usize,
    pub delay_one: usize,
    pub decay: f64,
}

#[allow(dead_code)]
impl EchoEngine {
    pub fn new(block_len: usize, delay_zero: usize, delay_one: usize, decay: f64) -> Self {
        Self { block_len, delay_zero, delay_one, decay }
    }
}

impl StegoEngine for EchoEngine {
    fn capacity(&self, carrier_len: usize) -> usize {
        let samples = carrier_len / 2;
        let blocks = samples / self.block_len;
        blocks / 8
    }

    fn embed(&self, carrier: &[u8], payload: &[u8]) -> Result<Vec<u8>> {
        if carrier.len() % 2 != 0 {
            bail!("echo engine requires i16 PCM (even byte count)");
        }
        let samples: Vec<f64> = carrier
            .chunks_exact(2)
            .map(|b| i16::from_le_bytes([b[0], b[1]]) as f64)
            .collect();

        let bits: Vec<u8> = payload.iter()
            .flat_map(|&b| (0..8).rev().map(move |i| (b >> i) & 1))
            .collect();

        let mut out = samples.clone();
        let mut bit_idx = 0;
        let mut blk = 0;

        while (blk + 1) * self.block_len <= samples.len() && bit_idx < bits.len() {
            let start = blk * self.block_len;
            let end = start + self.block_len;
            let delay = if bits[bit_idx] == 1 { self.delay_one } else { self.delay_zero };

            for i in start..end {
                if i >= delay {
                    out[i] += samples[i - delay] * self.decay;
                }
            }
            blk += 1;
            bit_idx += 1;
        }

        let result: Vec<u8> = out.iter()
            .flat_map(|&s| (s.clamp(i16::MIN as f64, i16::MAX as f64) as i16).to_le_bytes())
            .collect();
        Ok(result)
    }

    fn extract(&self, carrier: &[u8], payload_len: usize) -> Result<Vec<u8>> {


        if carrier.len() % 2 != 0 {
            bail!("echo engine requires i16 PCM");
        }
        let samples: Vec<f64> = carrier
            .chunks_exact(2)
            .map(|b| i16::from_le_bytes([b[0], b[1]]) as f64)
            .collect();

        let total_bits = payload_len * 8;
        let mut bits: Vec<u8> = Vec::with_capacity(total_bits);
        let mut blk = 0;

        while (blk + 1) * self.block_len <= samples.len() && bits.len() < total_bits {
            let start = blk * self.block_len;
            let end = start + self.block_len;
            let block = &samples[start..end];


            let energy = |delay: usize| -> f64 {
                (delay..block.len()).map(|i| block[i] * block[i - delay]).sum::<f64>()
            };
            let e0 = energy(self.delay_zero);
            let e1 = energy(self.delay_one);
            bits.push(if e1 > e0 { 1 } else { 0 });
            blk += 1;
        }

        let payload: Vec<u8> = bits.chunks(8)
            .map(|chunk| chunk.iter().enumerate().fold(0u8, |acc, (i, &b)| acc | (b << (7 - i))))
            .collect();
        Ok(payload)
    }
}
