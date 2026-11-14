---
name: video-production
description: Comprehensive video recording, programmatic React editing with Remotion, FFmpeg post-production, and Edge-TTS neural voice synthesis. Use when the user asks to record screen/browser, create demo videos, pitch decks, generate voiceovers, or edit and compose videos.
---

# 🎬 Video Production, Remotion & Voice Synthesis Skill

This skill equips the Antigravity agent with a production-grade multimedia suite to record, edit, synthesize speech, and render videos programmatically.

---

## 🛠️ Installed Tool Suite Location
All core CLI tools and templates are located at:
`C:\Users\khangmc\.gemini\tools\video_production`

---

## 1. 🎙️ Voice Synthesis (Edge-TTS)

Convert text or scripts into natural neural speech (Vietnamese & English).

### Command:
```powershell
python "C:\Users\khangmc\.gemini\tools\video_production\voice_tts.py" --text "Xin chào bà con, đây là AgriVision!" --voice vi-female --output "voice.mp3"
```

### Voice Options:
- `vi-female`: `vi-VN-HoaiMyNeural` (Giọng nữ thân thiện, truyền cảm, tự nhiên)
- `vi-male`: `vi-VN-NamMinhNeural` (Giọng nam ấm áp, chuyên nghiệp)
- `en-female`: `en-US-JennyNeural` (English US Female)
- `en-male`: `en-US-GuyNeural` (English US Male)

---

## 2. 🌐 Browser Screen Recording (Playwright + 60fps MP4)

Automatically records browser sessions, web application walkthroughs, and UI demos.

### Command:
```powershell
python "C:\Users\khangmc\.gemini\tools\video_production\record_browser.py" --url "http://nvnmc.asia:26272" --duration 12 --output "web_walkthrough.mp4" --width 1920 --height 1080
```

---

## 3. 🖥️ Desktop Screen Recording (FFmpeg gdigrab)

Captures full desktop screen in high resolution.

### Command:
```powershell
python "C:\Users\khangmc\.gemini\tools\video_production\record_screen.py" --duration 10 --fps 30 --output "desktop_demo.mp4"
```

---

## 4. ⚛️ Programmatic Video Editing with Remotion

Create motion graphics, pitch videos, and animations using React.

### Workspace Directory:
`C:\Users\khangmc\.gemini\tools\video_production\remotion_studio`

### Available Compositions:
1. `AgriVisionPitch` (1920x1080, 10s): Video thuyết trình dự án khởi nghiệp với hiệu ứng dynamic lighting, logo 3D, feature cards, và footer tác giả.
2. `ProductPromo` (1920x1080, 6s): Giới thiệu tính năng sản phẩm với spring typography.
3. `MobilePromo` (1080x1920, 6s vertical): Định dạng dọc cho thiết bị di động.

### Render Commands:
```powershell
cd "C:\Users\khangmc\.gemini\tools\video_production\remotion_studio"
remotion render src/index.ts AgriVisionPitch output_pitch.mp4
```

---

## 5. 🎞️ FFmpeg Video Editor & Post-Production

Assemble clips, dub voiceovers, trim, and create synced slideshows.

### Commands:
```powershell
# Lồng tiếng Voiceover vào Video
python "C:\Users\khangmc\.gemini\tools\video_production\video_editor.py" add-audio --video "raw.mp4" --audio "voice.mp3" --output "final_voiced.mp4"

# Cắt ghép đoạn Video
python "C:\Users\khangmc\.gemini\tools\video_production\video_editor.py" trim --video "input.mp4" --start "00:00:03" --end "00:00:18" --output "trimmed.mp4"

# Nối nhiều video lại với nhau
python "C:\Users\khangmc\.gemini\tools\video_production\video_editor.py" concat --inputs "clip1.mp4,clip2.mp4" --output "merged.mp4"
```
