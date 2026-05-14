use anyhow::{bail, Result};

pub const MAGIC: &[u8; 8] = b"ZSTEGO\x01\x00";
pub const HEADER_VERSION: u8 = 1;

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AlgoId {
    Lsb = 1,
    Dct = 2,
    Phase = 3,
    Echo = 4,
    Spread = 5,
}

impl AlgoId {
    pub fn from_u8(v: u8) -> Result<Self> {
        match v {
            1 => Ok(Self::Lsb),
            2 => Ok(Self::Dct),
            3 => Ok(Self::Phase),
            4 => Ok(Self::Echo),
            5 => Ok(Self::Spread),
            _ => bail!("unknown algorithm id: {v}"),
        }
    }
}

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CryptoId {
    AesGcm = 1,
    ChaCha = 2,
}

impl CryptoId {
    pub fn from_u8(v: u8) -> Result<Self> {
        match v {
            1 => Ok(Self::AesGcm),
            2 => Ok(Self::ChaCha),
            _ => bail!("unknown crypto id: {v}"),
        }
    }
}


pub const HEADER_SIZE: usize = 51;

#[derive(Debug, Clone)]
pub struct PayloadHeader {
    pub algo: AlgoId,
    pub crypto: CryptoId,
    pub lsb_bits: u8,
    pub salt: [u8; 16],
    pub nonce: [u8; 12],
    pub payload_size: u64,
}

impl PayloadHeader {
    pub fn new(algo: AlgoId, crypto: CryptoId, lsb_bits: u8, salt: [u8; 16], nonce: [u8; 12], payload_size: u64) -> Self {
        Self { algo, crypto, lsb_bits, salt, nonce, payload_size }
    }

    pub fn to_bytes(&self) -> [u8; HEADER_SIZE] {
        let mut buf = [0u8; HEADER_SIZE];
        buf[..8].copy_from_slice(MAGIC);
        buf[8] = HEADER_VERSION;
        buf[9] = self.algo as u8;
        buf[10] = self.crypto as u8;
        buf[11] = self.lsb_bits;
        buf[12..28].copy_from_slice(&self.salt);
        buf[28..40].copy_from_slice(&self.nonce);
        buf[40..48].copy_from_slice(&self.payload_size.to_le_bytes());
        buf
    }

    pub fn from_bytes(buf: &[u8]) -> Result<Self> {
        if buf.len() < HEADER_SIZE {
            bail!("buffer too small for header");
        }
        if &buf[..8] != MAGIC {
            bail!("invalid magic bytes — this may not be a Z-Stego carrier");
        }
        if buf[8] != HEADER_VERSION {
            bail!("unsupported header version: {}", buf[8]);
        }
        let algo = AlgoId::from_u8(buf[9])?;
        let crypto = CryptoId::from_u8(buf[10])?;
        let lsb_bits = buf[11];
        let mut salt = [0u8; 16];
        salt.copy_from_slice(&buf[12..28]);
        let mut nonce = [0u8; 12];
        nonce.copy_from_slice(&buf[28..40]);
        let payload_size = u64::from_le_bytes(buf[40..48].try_into().unwrap());
        Ok(Self { algo, crypto, lsb_bits, salt, nonce, payload_size })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip() {
        let h = PayloadHeader::new(AlgoId::Lsb, CryptoId::AesGcm, 2, [0xAB; 16], [0xCD; 12], 12345678);
        let bytes = h.to_bytes();
        let h2 = PayloadHeader::from_bytes(&bytes).unwrap();
        assert_eq!(h2.algo as u8, AlgoId::Lsb as u8);
        assert_eq!(h2.lsb_bits, 2);
        assert_eq!(h2.payload_size, 12345678);
    }
}
