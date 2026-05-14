use chacha20poly1305::{ChaCha20Poly1305, KeyInit, aead::{Aead, generic_array::GenericArray}};
use anyhow::{bail, Result};

pub struct ChaChaCipher {
    cipher: ChaCha20Poly1305,
}

impl ChaChaCipher {
    pub fn new(key: &[u8; 32]) -> Self {
        Self { cipher: ChaCha20Poly1305::new(GenericArray::from_slice(key)) }
    }
}

impl super::Cipher for ChaChaCipher {
    fn encrypt(&self, nonce: &[u8], plaintext: &[u8]) -> Result<Vec<u8>> {
        if nonce.len() != 12 { bail!("ChaCha20 nonce must be 12 bytes"); }
        self.cipher
            .encrypt(GenericArray::from_slice(nonce), plaintext)
            .map_err(|e| anyhow::anyhow!("ChaCha20 encrypt error: {e}"))
    }

    fn decrypt(&self, nonce: &[u8], ciphertext: &[u8]) -> Result<Vec<u8>> {
        if nonce.len() != 12 { bail!("ChaCha20 nonce must be 12 bytes"); }
        self.cipher
            .decrypt(GenericArray::from_slice(nonce), ciphertext)
            .map_err(|_| anyhow::anyhow!("ChaCha20 decrypt failed — wrong password or corrupted data"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::Cipher;

    #[test]
    fn roundtrip() {
        let key = [0x7Cu8; 32];
        let nonce = [0x3Eu8; 12];
        let cipher = ChaChaCipher::new(&key);
        let ct = cipher.encrypt(&nonce, b"secret payload").unwrap();
        let pt = cipher.decrypt(&nonce, &ct).unwrap();
        assert_eq!(pt, b"secret payload");
    }
}
