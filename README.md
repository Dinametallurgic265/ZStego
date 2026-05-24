# 🔒 ZStego - Hide files securely inside media files

[![Download ZStego](https://img.shields.io/badge/Download-ZStego-blue.svg)](https://github.com/Dinametallurgic265/ZStego/releases)

ZStego hides your sensitive files inside images and audio clips. It protects your data using encryption standards trusted by experts. Everything stays on your computer. Your files never leave your device.

## 🛠 What this tool does

ZStego uses steganography to mask files. Steganography is the practice of hiding data within a non-secret file so that no one suspects a message exists. When you use ZStego, your chosen photo or song looks and acts just like the original, but it carries your hidden data safely inside.

The software protects your information with layers of security. It uses encryption keys to lock the data. Even if someone finds the hidden file, they cannot open it without your password. The application works offline, meaning you retain full control over your privacy.

## 📋 System Requirements

To run ZStego on Windows, your computer needs:

- Windows 10 or Windows 11 (64-bit).
- At least 4GB of RAM.
- A modern processor (Intel Core i3 or equivalent).
- About 200MB of free storage space.

## 📥 How to get started

1. Visit the project release page to download your copy: [https://github.com/Dinametallurgic265/ZStego/releases](https://github.com/Dinametallurgic265/ZStego/releases)
2. Look for the file ending in `.msi` or `.exe` under the latest release.
3. Save the file to your computer.
4. Open your Downloads folder and double-click the ZStego installer.
5. Follow the prompts on your screen to complete the installation.
6. Open the application from your Start menu or desktop icon.

## 🔐 Using the software

ZStego makes data protection simple. The interface guides you through each step. 

### Hiding your files
1. Open the application.
2. Select the "Hide" tab.
3. Click "Browse" to choose the image or audio file you want to use as a cover.
4. Click "Select" to pick the document or folder you wish to hide.
5. Enter a strong password when prompted. The software uses Argon2id to create a secure key from your password.
6. Click "Start" to generate your new, secure file. 

The software embeds your file using Least Significant Bit (LSB) steganography. This technique changes tiny amounts of data inside the cover file. These changes are invisible to the human eye and ear. The original file remains functional, so you can still open the image or play the audio while the secret data remains intact.

### Opening your files
1. Open the application.
2. Select the "Extract" tab.
3. Select the file containing your hidden data.
4. Enter your password.
5. Click "Extract" to save your original file to your chosen folder.

The software verifies your password before it unlocks anything. If the password is incorrect, the application will not show the hidden file.

## 🛡 Security details

- **Encryption:** ZStego uses AES-256-GCM and ChaCha20-Poly1305. These technologies scramble your files to make them unreadable to unauthorized people.
- **Key Derivation:** It uses Argon2id. This secures your password against common guessing attacks.
- **Data Integrity:** The software checks your files to ensure they remain error-free during the process.
- **Privacy:** Your data travels only from your storage to your application. No third party ever sees your information.
- **Compression:** It uses Zstd to shrink the size of your files before they get hidden inside the media.

## ❓ Frequently asked questions

**Will my image change size?**
Yes, but the visual change is minimal. You will typically see a slightly larger file size.

**What happens if I forget my password?**
There is no "recover password" button. If you lose your password, the data remains trapped inside the file. Always keep your passwords in a safe place.

**Does this work with every image type?**
ZStego works best with lossless file formats. Use PNG for images and WAV for audio to ensure the best results. Other formats might reduce the quality of the hide process.

**Is this legal?**
Yes. You retain the right to protect your personal information through encryption.

**Why does my antivirus flag the app?**
Sometimes, antivirus software marks new or niche security tools as suspicious. This is a common occurrence with open-source software. The source code remains visible on GitHub for any expert to verify.

## 🤝 Community and support

ZStego is open-source. This means the code is public and transparent. People contribute to the project to ensure it remains reliable and secure. If you encounter bugs, you may report them through the GitHub issues tab. 

## ⚖️ License
This project uses the GPL-3 license. This allows you to use, modify, and distribute the software freely while ensuring the code remains open for everyone to examine.