use super::StegoEngine;
use anyhow::{bail, Result};
use rand::seq::SliceRandom;
use rand::SeedableRng as _;


pub struct LsbEngine {
    pub bits: u8,
    pub seed: Option<u64>,
}

impl LsbEngine {
    pub fn new(bits: u8, seed: Option<u64>) -> Self {
        assert!((1..=4).contains(&bits), "lsb bits must be 1-4");
        Self { bits, seed }
    }

    fn channel_order(&self, len: usize) -> Vec<usize> {
        let mut indices: Vec<usize> = (0..len).collect();
        if let Some(seed) = self.seed {
            let mut rng = rand::rngs::SmallRng::seed_from_u64(seed);
            indices.shuffle(&mut rng);
        }
        indices
    }
}

impl LsbEngine {


    pub fn embed_at_offset(&self, carrier: &[u8], payload: &[u8], start_channel: usize) -> Result<Vec<u8>> {
        let indices = self.channel_order(carrier.len());
        if start_channel > indices.len() {
            bail!("start_channel {} exceeds carrier length {}", start_channel, indices.len());
        }
        let remaining = indices.len() - start_channel;
        let cap = (remaining * self.bits as usize) / 8;
        if payload.len() > cap {
            bail!(
                "payload ({} bytes) exceeds available capacity ({} bytes) at {} LSB bits",
                payload.len(), cap, self.bits
            );
        }

        let mut out = carrier.to_vec();
        let mask: u8 = !((1 << self.bits) - 1);
        let bits_mask: u8 = (1 << self.bits) - 1;
        let total_bits = payload.len() * 8;
        let mut bit_pos = 0usize;

        for &idx in &indices[start_channel..] {
            if bit_pos >= total_bits { break; }
            let mut chunk: u8 = 0;
            for b in 0..self.bits as usize {
                if bit_pos + b < total_bits {
                    let byte_i = (bit_pos + b) / 8;
                    let bit_i  = 7 - ((bit_pos + b) % 8);
                    let bit    = (payload[byte_i] >> bit_i) & 1;
                    chunk |= bit << (self.bits as usize - 1 - b);
                }
            }
            out[idx] = (out[idx] & mask) | (chunk & bits_mask);
            bit_pos += self.bits as usize;
        }
        Ok(out)
    }


    pub fn extract_at_offset(&self, carrier: &[u8], payload_len: usize, start_channel: usize) -> Result<Vec<u8>> {
        let bits_mask: u8 = (1 << self.bits) - 1;
        let indices = self.channel_order(carrier.len());
        let total_bits = payload_len * 8;
        let mut payload = vec![0u8; payload_len];
        let mut bit_pos = 0usize;

        for &idx in &indices[start_channel..] {
            if bit_pos >= total_bits { break; }
            let chunk = carrier[idx] & bits_mask;
            for b in 0..self.bits as usize {
                if bit_pos + b < total_bits {
                    let byte_i = (bit_pos + b) / 8;
                    let bit_i  = 7 - ((bit_pos + b) % 8);
                    let bit    = (chunk >> (self.bits as usize - 1 - b)) & 1;
                    payload[byte_i] |= bit << bit_i;
                }
            }
            bit_pos += self.bits as usize;
        }
        Ok(payload)
    }
}

impl StegoEngine for LsbEngine {
    fn capacity(&self, carrier_len: usize) -> usize {
        (carrier_len * self.bits as usize) / 8
    }

    fn embed(&self, carrier: &[u8], payload: &[u8]) -> Result<Vec<u8>> {
        let cap = self.capacity(carrier.len());
        if payload.len() > cap {
            bail!(
                "payload ({} bytes) exceeds carrier capacity ({} bytes) at {} LSB bits",
                payload.len(), cap, self.bits
            );
        }

        let mut out = carrier.to_vec();
        let mask: u8 = !((1 << self.bits) - 1);
        let bits_mask: u8 = (1 << self.bits) - 1;

        let indices = self.channel_order(carrier.len());

        let mut bit_pos: usize = 0;
        let total_bits = payload.len() * 8;

        for &idx in &indices {
            if bit_pos >= total_bits {
                break;
            }

            let mut chunk: u8 = 0;
            for b in 0..self.bits as usize {
                if bit_pos + b < total_bits {
                    let byte_i = (bit_pos + b) / 8;
                    let bit_i = 7 - ((bit_pos + b) % 8);
                    let bit = (payload[byte_i] >> bit_i) & 1;
                    chunk |= bit << (self.bits as usize - 1 - b);
                }
            }
            out[idx] = (out[idx] & mask) | (chunk & bits_mask);
            bit_pos += self.bits as usize;
        }

        Ok(out)
    }

    fn extract(&self, carrier: &[u8], payload_len: usize) -> Result<Vec<u8>> {
        let bits_mask: u8 = (1 << self.bits) - 1;
        let indices = self.channel_order(carrier.len());
        let total_bits = payload_len * 8;

        let mut payload = vec![0u8; payload_len];
        let mut bit_pos: usize = 0;

        for &idx in &indices {
            if bit_pos >= total_bits {
                break;
            }
            let chunk = carrier[idx] & bits_mask;
            for b in 0..self.bits as usize {
                if bit_pos + b < total_bits {
                    let byte_i = (bit_pos + b) / 8;
                    let bit_i = 7 - ((bit_pos + b) % 8);
                    let bit = (chunk >> (self.bits as usize - 1 - b)) & 1;
                    payload[byte_i] |= bit << bit_i;
                }
            }
            bit_pos += self.bits as usize;
        }

        Ok(payload)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_1bit() {
        let carrier = vec![0u8; 1024];
        let payload = b"Hello, Z-Stego!";
        let eng = LsbEngine::new(1, None);
        let stego = eng.embed(&carrier, payload).unwrap();
        let extracted = eng.extract(&stego, payload.len()).unwrap();
        assert_eq!(extracted, payload);
    }

    #[test]
    fn roundtrip_4bit() {
        let carrier = vec![0xAAu8; 512];
        let payload = b"4-bit LSB test";
        let eng = LsbEngine::new(4, None);
        let stego = eng.embed(&carrier, payload).unwrap();
        let extracted = eng.extract(&stego, payload.len()).unwrap();
        assert_eq!(extracted, payload);
    }

    #[test]
    fn roundtrip_shuffled() {
        let carrier = vec![0u8; 2048];
        let payload = b"Shuffled LSB steganography test!";
        let eng = LsbEngine::new(2, Some(0xDEADBEEF));
        let stego = eng.embed(&carrier, payload).unwrap();
        let extracted = eng.extract(&stego, payload.len()).unwrap();
        assert_eq!(extracted, payload);
    }

    #[test]
    fn capacity() {
        let eng = LsbEngine::new(2, None);
        assert_eq!(eng.capacity(800), 200);
    }

    #[test]
    fn overflow_rejected() {
        let carrier = vec![0u8; 8];
        let eng = LsbEngine::new(1, None);
        assert!(eng.embed(&carrier, b"too much data here!").is_err());
    }
}
