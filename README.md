# 🎂 Happy Birthday Babe — A Magical Birthday Surprise ✨

> A magical, interactive, and luxurious birthday surprise website dedicated to **Naincy** 💖

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)
![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)

---

## ✨ What Is This?

A fully interactive birthday website built from scratch for **Naincy** — a romantic, animated surprise that starts with an **archery mini-game** and unlocks a celebration world full of an interactive cake, polaroid memories, a secret wax-sealed letter, and a surprise gift box.

The user (the birthday queen 🥰) has to **pull the golden bow & shoot the heart** to unlock the surprise — and then explore four magical experiences.

---

## 🏹 How It Works

### Scene 1 — The Archery Game 🎯
- A glowing 3D heart target (with a golden ribbon and **NAINCY** written on it) floats in an aurora sky.
- Drag the arrow **backward and release** to shoot it at the heart. 🏹
- Hit the heart and the celebration world unlocks with a burst of hearts and confetti!

### Scene 2 — The Celebration World 🎉
Once unlocked, four tabs are waiting:

| Tab | Experience |
| --- | --- |
| 🎂 **Make a Wish** | An interactive 3-layered cake with **5 lit candles**. Tap each candle to blow it out (or hit **✨ Blow All Candles**). When all are out — wish granted + confetti rain! |
| 📸 **Memories** | A tilted **polaroid gallery** of special photos, pinned to a board. You can also **upload custom photos** and they join the gallery instantly. |
| ✉️ **Secret Letter** | A wax-sealed envelope with a golden **"N"** seal. Click the seal to open a heartfelt birthday letter. |
| 🎁 **Surprise Box** | A glowing gift box — tap to unwrap and reveal a surprise card with badges like *100% Happiness Guaranteed* & *Endless Love*. 💝 |

### Extra touches ✨
- 🎵 **Birthday music** with play/pause, mute, volume slider & SFX toggle (Web Audio API).
- 🎊 Real-time **confetti, hearts & fairy-dust** particle system on canvas.
- 🖱️ **Cursor sparkle trail** as you move your mouse.
- ⛶ Fullscreen mode, **Replay celebration** & **Restart game** buttons.
- 📱 Fully **responsive** & mobile-friendly, with `prefers-reduced-motion` support.
- 🌐 Google Fonts (Great Vibes, Outfit, Playfair Display) + GSAP animations (with a built-in fallback if the CDN is slow).
- 💌 Floating Instagram links for **Betu ❤️** and **Babe 💕**.

---

## 📁 Project Structure

```
babe-birthday/
├── index.html          # Main page — all scenes, tabs & content
├── style.css           # Luxury glassmorphic theme, animations & responsive layout
├── script.js           # Game logic, particles, audio, tabs & interactions
├── images/
│   ├── icon.jpg        # Favicon
│   ├── photo1.jpg      # Polaroid memory photo
│   ├── photo2.jpeg     # Polaroid memory photo
│   ├── photo3.jpeg     # Polaroid memory photo
│   └── photo4.jpeg     # Polaroid memory photo
├── heart.png           # Heart asset
├── arrow.svg           # Arrow asset
├── XmewgMToaDtGIrf5gYUeFuF6gjLVA_XCmbavAb3Pr6o.mp3   # Background music
└── venv/               # ⚠️ Accidentally committed — safe to delete (see notes)
```

---

## 🚀 Getting Started

### Option 1 — Just open it (easiest)
1. Download / clone the repo.
2. Double-click `index.html` and open it in any browser. 🎈

### Option 2 — Run a local server (recommended)
```bash
# Python
python -m http.server 8000
# then visit http://localhost:8000

# or with Node
npx serve .
```

> 💡 The music file is a WAV audio (RIFF) with an `.mp3` extension — it still plays fine in all browsers, but you can rename it to `.wav` if you prefer.

---

## 🎨 Customizing It For Your Own Special Someone

This site is easy to personalize:

1. **Change the name** — replace `Naincy` in `index.html` (title, heart target, cake text, letter, gift card, etc.).
2. **Change the photos** — swap files in `images/` (keep the same filenames) or use the **Add Custom Photo** button on the site.
3. **Write your own letter** — edit the paragraphs in the `letterTab` section of `index.html`.
4. **Change the music** — replace the `.mp3`/WAV file (keep the filename or update the `<audio>` src).
5. **Change Instagram links** — update the `href` in the floating contact buttons.
6. **Remove Google Analytics** — delete the `gtag.js` snippet in `<head>` if you don't want tracking.

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | HTML5, CSS3 (glassmorphism, custom animations) |
| **Logic** | Vanilla JavaScript (no framework) |
| **Animation** | GSAP 3.12 (CDN) + custom canvas particle engine |
| **Audio** | Web Audio API |
| **Fonts** | Google Fonts — Great Vibes, Outfit, Playfair Display |

---

## ⚠️ Housekeeping Notes

- The `venv/` folder (a Python virtual environment) was accidentally committed — it's **not needed** to run this site. Consider removing it and adding a `.gitignore`:
  ```gitignore
  venv/
  .DS_Store
  ```
- `heart.png` and `arrow.svg` are legacy assets (not referenced by the current code) — you can keep or remove them.

---

## 💝 Made With Love

This project was built with ❤️ by **Ankit** (Betu) for **Naincy** (Babe).

> *"Happy Birthday, my dear Babe! 🎉 May this year bring you endless happiness, unforgettable adventures, love, and all the success you truly deserve."*

---

## 📄 License

No license specified. Feel free to use it as inspiration for your own special someone — just add your own ❤️.
