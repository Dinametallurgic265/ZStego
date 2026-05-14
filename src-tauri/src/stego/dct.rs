use super::StegoEngine;
use anyhow::{bail, Result};


#[allow(dead_code)]
pub struct DctEngine {
    pub threshold: f32,
}

#[allow(dead_code)]
impl DctEngine {
    pub fn new(threshold: f32) -> Self {
        Self { threshold }
    }

    fn usable_indices(coeffs: &[f32]) -> Vec<usize> {
        coeffs.iter().enumerate()
            .filter(|(i, &v)| {

                let block_pos = i % 64;
                block_pos >= 5 && block_pos <= 40 && v.abs() > 0.5
            })
            .map(|(i, _)| i)
            .collect()
    }
}

impl StegoEngine for DctEngine {
    fn capacity(&self, carrier_len: usize) -> usize {

        (carrier_len / 64) * 15 / 8
    }

    fn embed(&self, carrier: &[u8], payload: &[u8]) -> Result<Vec<u8>> {
        if carrier.len() % 4 != 0 {
            bail!("DCT carrier must be f32 array (len divisible by 4)");
        }
        let mut coeffs: Vec<f32> = carrier
            .chunks_exact(4)
            .map(|b| f32::from_le_bytes(b.try_into().unwrap()))
            .collect();

        let usable = Self::usable_indices(&coeffs);
        let cap = usable.len() / 8;
        if payload.len() > cap {
            bail!("payload too large for DCT carrier capacity ({cap} bytes)");
        }

        let mut bit_pos = 0usize;
        for &idx in &usable {
            if bit_pos >= payload.len() * 8 {
                break;
            }
            let byte_i = bit_pos / 8;
            let bit_i = 7 - (bit_pos % 8);
            let bit = (payload[byte_i] >> bit_i) & 1;

            let v = coeffs[idx];
            let floor = v.floor();
            coeffs[idx] = floor + if bit == 1 { 0.75 } else { 0.25 };
            bit_pos += 1;
        }

        let out: Vec<u8> = coeffs.iter().flat_map(|f| f.to_le_bytes()).collect();
        Ok(out)
    }

    fn extract(&self, carrier: &[u8], payload_len: usize) -> Result<Vec<u8>> {
        if carrier.len() % 4 != 0 {
            bail!("DCT carrier must be f32 array");
        }
        let coeffs: Vec<f32> = carrier
            .chunks_exact(4)
            .map(|b| f32::from_le_bytes(b.try_into().unwrap()))
            .collect();

        let usable = Self::usable_indices(&coeffs);
        let mut payload = vec![0u8; payload_len];
        let mut bit_pos = 0usize;

        for &idx in &usable {
            if bit_pos >= payload_len * 8 {
                break;
            }
            let frac = coeffs[idx].fract();
            let bit: u8 = if frac > 0.5 { 1 } else { 0 };
            let byte_i = bit_pos / 8;
            let bit_i = 7 - (bit_pos % 8);
            payload[byte_i] |= bit << bit_i;
            bit_pos += 1;
        }

        Ok(payload)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip() {

        let mut carrier_f: Vec<f32> = (0..640)
            .map(|i| {
                let block = i % 64;
                if block >= 5 && block <= 40 { 3.0 } else { 0.0 }
            })
            .collect();
        let carrier: Vec<u8> = carrier_f.iter().flat_map(|f| f.to_le_bytes()).collect();
        let payload = b"DCT";
        let eng = DctEngine::new(0.5);
        let stego = eng.embed(&carrier, payload).unwrap();
        let out = eng.extract(&stego, payload.len()).unwrap();
        assert_eq!(out, payload);
    }
}
