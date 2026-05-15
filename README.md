<div align="center">
  <svg width="72" height="72" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="url(#grad)" opacity="0.15"/>
    <path d="M14 14h36L14 50h36" stroke="url(#grad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <defs>
      <linearGradient id="grad" x1="14" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop stop-color="#7c5cfc"/><stop offset="1" stop-color="#3ecfcf"/>
      </linearGradient>
    </defs>
  </svg>

  <h1>Z-Stego</h1>

  <p>
    <a href="https://github.com/TheHolyOneZ/ZStego/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-7c5cfc?style=flat-square" alt="License: GPL-3.0"/></a>
    <a href="https://zsync.eu/zstego/"><img src="https://img.shields.io/badge/download-zsync.eu%2Fzstego-3ecfcf?style=flat-square" alt="Download"/></a>
    <img src="https://img.shields.io/badge/version-0.1.0-f0b429?style=flat-square" alt="Version 0.1.0"/>
    <img src="https://img.shields.io/badge/platform-Linux%20%7C%20Windows%20%7C%20macOS-9b9bb0?style=flat-square" alt="Platform"/>
    <img src="https://img.shields.io/badge/built%20with-Tauri%20v2%20%2B%20Rust-f74c00?style=flat-square" alt="Built with Tauri v2 + Rust"/>
  </p>

  <p><strong>Hide encrypted files inside images and audio — locally, with no servers and no telemetry.</strong></p>

  <p>
    <a href="https://zsync.eu/zstego/">Website & Download</a> ·
    <a href="https://zsync.eu/zstego/docs/">Documentation</a> ·
    <a href="https://zsync.eu">More Projects</a>
  </p>
</div>

---

## What is Z-Stego?

Z-Stego is a cross-platform desktop application for **steganography** — the practice of concealing data inside ordinary files. It embeds encrypted payloads into images and audio files using LSB (Least Significant Bit) techniques, producing output files that look and play back identically to the originals.

Everything runs entirely on your machine. No accounts, no network calls, no cloud, no telemetry.

> [!IMPORTANT]
> Z-Stego is built for privacy and security research. Use it responsibly and in accordance with the laws in your jurisdiction.

---

## Features

| Feature | Details |
|---|---|
| **Dual encryption** | AES-256-GCM or ChaCha20-Poly1305 — your choice |
| **Key derivation** | Argon2id — password-hardened, no weak keys |
| **Compression** | zstd compresses the payload before encryption |
| **Image steganography** | LSB embedding in PNG and BMP |
| **Audio steganography** | LSB embedding in WAV and FLAC |
| **Visual analysis** | LSB maps, histograms, per-channel diffs, waveform views |
| **Test bench** | 20 automated roundtrip tests across all algorithm combos |
| **Cross-platform** | Native installers for Linux, Windows, and macOS |
| **Zero network** | No servers, no telemetry, no cloud — ever |

---

## Download

Pre-built installers are available at **[zsync.eu/zstego](https://zsync.eu/zstego/)**.

| Platform | Format | Architecture |
|---|---|---|
| Linux | `.deb` | amd64 |
| Linux | `.rpm` | x86_64 |
| Linux | `.AppImage` | amd64 |
| Windows | `.exe` (NSIS) | x64 |
| Windows | `.msi` | x64 |
| macOS | `.dmg` | Apple Silicon (aarch64) |
| macOS | `.dmg` | Intel (x64) |
| macOS | `.dmg` | Universal (Fat Binary) |

> [!TIP]
> If you're on macOS and unsure which to pick, download the **Universal** DMG — it runs natively on both Apple Silicon and Intel.

---

## Tech Stack

| Component | Role |
|---|---|
| **Tauri v2** | App shell & IPC bridge |
| **Rust** | Backend — all steganography and cryptography |
| **React + TypeScript** | Frontend UI |
| **Vite** | Build tooling & HMR |
| **AES-256-GCM** | Symmetric encryption (option 1) |
| **ChaCha20-Poly1305** | Symmetric encryption (option 2) |
| **Argon2id** | Password-based key derivation |
| **zstd** | Payload compression before encryption |
| **LSB steganography** | Image & audio data embedding |

---

## Build from Source

### Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain)
- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 9+
- Tauri v2 system dependencies — see the [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/)

### Steps

```bash
git clone https://github.com/TheHolyOneZ/ZStego.git
cd ZStego
pnpm install
```

```bash
pnpm tauri dev      # Development server with HMR
pnpm tauri build    # Production build + native installers
```

> [!NOTE]
> On Linux you'll need a few extra system packages (`libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, etc.). The full list is in the [Tauri Linux prerequisites](https://v2.tauri.app/start/prerequisites/#linux).

---

## Documentation

Full documentation — including guides for the embed/extract workflow, encryption details, steganography techniques, and supported formats — is available at:

**[zsync.eu/zstego/docs](https://zsync.eu/zstego/docs/)**

---

## Author

Made by **[TheHolyOneZ](https://zsync.eu)**.

More projects at **[zsync.eu](https://zsync.eu)**.

---

## License

Z-Stego is free and open-source software released under the **GNU General Public License v3.0**.

You are free to use, study, modify, and distribute it under the same terms.

```
Copyright (C) 2026 TheHolyOneZ
```

See [LICENSE](LICENSE) for the full license text.
