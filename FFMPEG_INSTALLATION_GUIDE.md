# FFmpeg Installation Guide

FFmpeg is required for audio/video processing in the recording system. Here's how to install it on different operating systems.

## 🪟 Windows Installation (Your System)

### Method 1: Using Chocolatey (Recommended - Easiest)

**Step 1: Install Chocolatey (if not already installed)**
1. Open PowerShell as Administrator
2. Run this command:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**Step 2: Install FFmpeg**
```powershell
choco install ffmpeg
```

**Step 3: Verify Installation**
```powershell
ffmpeg -version
```

### Method 2: Manual Installation

**Step 1: Download FFmpeg**
1. Go to https://ffmpeg.org/download.html
2. Click "Windows" 
3. Click "Windows builds by BtbN"
4. Download the latest release (ffmpeg-master-latest-win64-gpl.zip)

**Step 2: Extract Files**
1. Extract the ZIP file to `C:\ffmpeg`
2. You should have: `C:\ffmpeg\bin\ffmpeg.exe`

**Step 3: Add to PATH**
1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Click "Environment Variables"
3. Under "System Variables", find and select "Path"
4. Click "Edit" → "New"
5. Add: `C:\ffmpeg\bin`
6. Click "OK" on all dialogs

**Step 4: Restart Terminal**
- Close all command prompts/PowerShell windows
- Open new PowerShell and test:
```powershell
ffmpeg -version
```

### Method 3: Using Scoop (Alternative Package Manager)

**Step 1: Install Scoop**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

**Step 2: Install FFmpeg**
```powershell
scoop install ffmpeg
```

### Method 4: Using winget (Windows Package Manager)

```powershell
winget install "FFmpeg (Essentials Build)"
```

## 🍎 macOS Installation

### Method 1: Using Homebrew (Recommended)

**Step 1: Install Homebrew (if not installed)**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Step 2: Install FFmpeg**
```bash
brew install ffmpeg
```

**Step 3: Verify**
```bash
ffmpeg -version
```

### Method 2: Using MacPorts

```bash
sudo port install ffmpeg
```

## 🐧 Linux Installation

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

### CentOS/RHEL/Fedora
```bash
# Fedora
sudo dnf install ffmpeg

# CentOS/RHEL (enable EPEL first)
sudo yum install epel-release
sudo yum install ffmpeg
```

### Arch Linux
```bash
sudo pacman -S ffmpeg
```

## ✅ Verify Installation

After installation, test FFmpeg:

```bash
# Check version
ffmpeg -version

# Should show something like:
# ffmpeg version 4.4.2 Copyright (c) 2000-2021 the FFmpeg developers
# built with gcc 9 (Ubuntu 9.4.0-1ubuntu1~20.04.1)
```

## 🔧 Troubleshooting

### Windows Issues

**"ffmpeg is not recognized as an internal or external command"**

**Solution 1: Check PATH**
```powershell
# Check if ffmpeg is in PATH
$env:PATH -split ';' | Where-Object { $_ -like '*ffmpeg*' }

# If empty, add to PATH manually:
$env:PATH += ";C:\ffmpeg\bin"
```

**Solution 2: Use Full Path**
```powershell
# Test with full path
C:\ffmpeg\bin\ffmpeg.exe -version
```

**Solution 3: Restart Computer**
- Sometimes PATH changes require a full restart

### Permission Issues

**Windows:**
- Run PowerShell as Administrator
- Check antivirus isn't blocking the download

**macOS/Linux:**
- Use `sudo` for system-wide installation
- Check file permissions: `chmod +x /usr/local/bin/ffmpeg`

### Download Issues

**Slow Download:**
- Try different mirror from https://ffmpeg.org/download.html
- Use package manager instead of manual download

**Blocked by Firewall:**
- Temporarily disable firewall/antivirus
- Use corporate network bypass if needed

## 🚀 Quick Test for Recording System

After installing FFmpeg, test it works with our system:

```bash
cd Ai_powered_interview_coach
python quick_system_check.py
```

You should see:
```
📋 Checking FFmpeg...
✅ FFmpeg installed
```

## 📋 Alternative: FFmpeg-Python Only

If you have issues with system FFmpeg, you can try Python-only approach:

```bash
pip install ffmpeg-python
```

However, this still requires FFmpeg binaries, so system installation is recommended.

## 🎯 For Recording System

The recording system uses FFmpeg for:
- **Audio extraction** from video files
- **Format conversion** (WebM → WAV for processing)
- **Audio preprocessing** for Whisper transcription

Without FFmpeg, you'll get errors like:
- "Failed to extract audio from video"
- "Audio conversion failed"
- "FFmpeg not available" in health check

## ✅ Success Indicators

You'll know FFmpeg is properly installed when:

1. **Command works**: `ffmpeg -version` shows version info
2. **Health check passes**: `python quick_system_check.py` shows ✅ FFmpeg
3. **Recording works**: Audio/video processing completes without errors
4. **No errors in logs**: Backend doesn't show FFmpeg-related errors

## 🆘 Still Having Issues?

If FFmpeg installation fails:

1. **Try different method**: Use package manager instead of manual
2. **Check system requirements**: Ensure 64-bit system
3. **Disable antivirus**: Temporarily during installation
4. **Use portable version**: Download portable FFmpeg build
5. **Contact support**: Provide error messages and system details

## 📝 Notes for Different Systems

**Windows 11/10**: All methods should work
**Windows 8/7**: Use manual installation method
**Corporate Networks**: May need IT approval for installations
**Virtual Machines**: Ensure sufficient resources allocated

---

**Recommended for your Windows system**: Use **Chocolatey method** (Method 1) as it's the easiest and handles PATH automatically.