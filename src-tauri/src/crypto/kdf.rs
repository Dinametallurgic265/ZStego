use anyhow::Result;
use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::SaltString;

pub const KEY_LEN: usize = 32;


pub fn derive_key(password: &str, salt: &[u8; 16]) -> Result<[u8; KEY_LEN]> {
    let salt_b64 = base64::Engine::encode(
        &base64::engine::general_purpose::STANDARD_NO_PAD,
        salt,
    );
    let salt_str = SaltString::from_b64(&salt_b64)
        .map_err(|e| anyhow::anyhow!("invalid salt: {e}"))?;

    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt_str)
        .map_err(|e| anyhow::anyhow!("argon2 error: {e}"))?;

    let raw = hash.hash.ok_or_else(|| anyhow::anyhow!("no hash output"))?;
    let bytes = raw.as_bytes();
    let mut key = [0u8; KEY_LEN];
    let len = bytes.len().min(KEY_LEN);
    key[..len].copy_from_slice(&bytes[..len]);
    Ok(key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deterministic() {
        let salt = [0x42u8; 16];
        let k1 = derive_key("hunter2", &salt).unwrap();
        let k2 = derive_key("hunter2", &salt).unwrap();
        assert_eq!(k1, k2);
    }

    #[test]
    fn different_passwords_differ() {
        let salt = [0x01u8; 16];
        let k1 = derive_key("abc", &salt).unwrap();
        let k2 = derive_key("xyz", &salt).unwrap();
        assert_ne!(k1, k2);
    }
}
