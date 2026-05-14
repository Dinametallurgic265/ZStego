use aes_gcm::{Aes256Gcm, KeyInit, aead::{Aead, generic_array::GenericArray}};
use anyhow::{bail, Result};

pub struct AesGcmCipher {
    cipher: Aes256Gcm,
}

impl AesGcmCipher {
    pub fn new(key: &[u8; 32]) -> Self {
        Self { cipher: Aes256Gcm::new(GenericArray::from_slice(key)) }
    }
}

impl super::Cipher for AesGcmCipher {
    fn encrypt(&self, nonce: &[u8], plaintext: &[u8]) -> Result<Vec<u8>> {
        if nonce.len() != 12 { bail!("AES-GCM nonce must be 12 bytes"); }
        self.cipher
            .encrypt(GenericArray::from_slice(nonce), plaintext)
            .map_err(|e| anyhow::anyhow!("AES-GCM encrypt error: {e}"))
    }

    fn decrypt(&self, nonce: &[u8], ciphertext: &[u8]) -> Result<Vec<u8>> {
        if nonce.len() != 12 { bail!("AES-GCM nonce must be 12 bytes"); }
        self.cipher
            .decrypt(GenericArray::from_slice(nonce), ciphertext)
            .map_err(|_| anyhow::anyhow!("AES-GCM decrypt failed — wrong password or corrupted data"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::Cipher;

    #[test]
    fn roundtrip() {
        let key = [0xABu8; 32];
        let nonce = [0x11u8; 12];
        let cipher = AesGcmCipher::new(&key);
        let ct = cipher.encrypt(&nonce, b"hello world").unwrap();
        let pt = cipher.decrypt(&nonce, &ct).unwrap();
        assert_eq!(pt, b"hello world");
    }
}
