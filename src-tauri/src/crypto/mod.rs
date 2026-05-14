pub mod aes_gcm;
pub mod chacha;
pub mod kdf;

pub use kdf::derive_key;

pub trait Cipher: Send + Sync {
    fn encrypt(&self, nonce: &[u8], plaintext: &[u8]) -> anyhow::Result<Vec<u8>>;
    fn decrypt(&self, nonce: &[u8], ciphertext: &[u8]) -> anyhow::Result<Vec<u8>>;
}
