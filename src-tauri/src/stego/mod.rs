pub mod dct;
pub mod echo;
pub mod lsb;
pub mod phase;
pub mod spread;

use anyhow::Result;

pub trait StegoEngine: Send + Sync {

    fn embed(&self, carrier: &[u8], payload: &[u8]) -> Result<Vec<u8>>;


    fn extract(&self, carrier: &[u8], payload_len: usize) -> Result<Vec<u8>>;


    fn capacity(&self, carrier_len: usize) -> usize;
}
