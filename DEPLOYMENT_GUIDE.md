# Deployment Guide - Installers & Website

This guide covers how to create installers and deploy the website to GitHub Pages.

---

## 🌐 Part 1: Deploy Website to GitHub Pages

### One-Time Setup

1. **Enable GitHub Pages:**
   - Go to your GitHub repository
   - Click **Settings** → **Pages**
   - Under "Build and deployment":
     - Source: **GitHub Actions**
   - Click **Save**

2. **Verify Repository Name:**
   - Your repo is named: `Staubfaenger`
   - The site will be at: `https://umeinhardt.github.io/Staubfaenger/`

### Deploy the Website

**Option A: Automatic Deployment (Recommended)**

Every time you push to the `main` branch, the website automatically deploys!

```bash
git add .
git commit -m "Update website"
git push origin main
```

Wait 2-3 minutes, then visit: https://umeinhardt.github.io/Staubfaenger/

**Option B: Manual Deployment**

```bash
npm run deploy
```

This builds and deploys immediately.

### Verify Deployment

1. Go to: https://github.com/umeinhardt/Staubfaenger/actions
2. Look for "Deploy to GitHub Pages" workflow
3. Wait for green checkmark ✅
4. Visit: https://umeinhardt.github.io/Staubfaenger/

---

## 💻 Part 2: Create Desktop Installers

### Prerequisites

Install dependencies (if not already done):
```bash
npm install
```

### Build Windows Installer

```bash
npm run electron:build:win
```

**Output:**
- `release/DustParticleAggregation Setup X.X.X.exe` - Installer
- `release/win-unpacked/` - Portable version (no install needed)

**File sizes:**
- Installer: ~150-200 MB
- Portable: ~200-250 MB (uncompressed)

### Build for All Platforms (if on Mac/Linux)

```bash
# Mac only
npm run electron:build:mac

# Linux only
npm run electron:build:linux

# All platforms (requires Mac for macOS builds)
npm run electron:build:all
```

### Test the Installer Locally

1. Navigate to `release/` folder
2. Run the `.exe` installer
3. Install the application
4. Launch from Start Menu
5. Verify all features work

---

## 🚀 Part 3: Create GitHub Release with Installers

### Step 1: Create a Git Tag

```bash
# Create a version tag (e.g., v1.0.0)
git tag v1.0.0

# Push the tag to GitHub
git push origin v1.0.0
```

### Step 2: Automatic Build & Release

The GitHub Actions workflow will automatically:
1. Build the Windows installer
2. Create a GitHub Release
3. Upload the installer files
4. Add release notes

**Monitor progress:**
- Go to: https://github.com/umeinhardt/Staubfaenger/actions
- Look for "Build and Release" workflow
- Wait for completion (~5-10 minutes)

### Step 3: Verify Release

1. Go to: https://github.com/umeinhardt/Staubfaenger/releases
2. You should see your new release (e.g., "Release v1.0.0")
3. Download links for:
   - `DustParticleAggregation-Windows-Setup.exe`
   - `DustParticleAggregation-Windows-Portable.zip`

---

## 📦 Part 4: Distribution Options

### Option 1: GitHub Releases (Recommended)

**Pros:**
- ✅ Free hosting
- ✅ Automatic builds via GitHub Actions
- ✅ Version tracking
- ✅ Download statistics

**Cons:**
- ❌ Users need GitHub account to download (optional)
- ❌ Large file sizes count against bandwidth

**Best for:** Open source projects, technical users

### Option 2: GitHub Pages (Web Version)

**Pros:**
- ✅ No installation required
- ✅ Works on any platform (Windows, Mac, Linux)
- ✅ Always up-to-date
- ✅ Easy to share (just a URL)

**Cons:**
- ❌ Requires internet connection
- ❌ Slightly slower than desktop app

**Best for:** Quick demos, sharing with non-technical users

### Option 3: Both (Recommended!)

Offer both options:
- **Website:** For quick access and demos
- **Desktop App:** For offline use and better performance

---

## 🎯 Quick Start Checklist

- [ ] Enable GitHub Pages in repository settings
- [ ] Push code to `main` branch
- [ ] Wait for automatic deployment
- [ ] Visit website: https://umeinhardt.github.io/Staubfaenger/
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Wait for release build
- [ ] Download and test installer
- [ ] Share links with users!

---

## 📝 Version Numbering

Use semantic versioning: `vMAJOR.MINOR.PATCH`

Examples:
- `v1.0.0` - First stable release
- `v1.1.0` - New features added
- `v1.1.1` - Bug fixes
- `v2.0.0` - Major changes/breaking changes

---

## 🔧 Troubleshooting

### Website not updating?

1. Check GitHub Actions: https://github.com/umeinhardt/Staubfaenger/actions
2. Look for errors in the workflow
3. Clear browser cache (Ctrl+Shift+R)
4. Wait 5 minutes and try again

### Installer build failing?

1. Check you're on Windows (for Windows builds)
2. Run `npm ci` to reinstall dependencies
3. Delete `node_modules` and `release` folders
4. Run `npm install` again
5. Try building again

### Release not creating?

1. Verify tag format: `v1.0.0` (must start with 'v')
2. Check GitHub Actions permissions
3. Ensure `GITHUB_TOKEN` has write access

### Large file sizes?

This is normal for Electron apps:
- Includes Chromium browser (~100MB)
- Includes Node.js runtime (~50MB)
- Your app code (~10-20MB)

To reduce size:
- Use `electron-builder` compression
- Remove unused dependencies
- Consider web-only version for smaller footprint

---

## 🌟 Sharing Your Project

### For Users:

**Website:**
```
Try it online: https://umeinhardt.github.io/Staubfaenger/
No installation required!
```

**Desktop App:**
```
Download for Windows:
https://github.com/umeinhardt/Staubfaenger/releases/latest

Choose:
- Setup.exe (installer)
- Portable.zip (no install needed)
```

### For Developers:

```
Source code: https://github.com/umeinhardt/Staubfaenger
Clone: git clone https://github.com/umeinhardt/Staubfaenger.git
```

---

## 📊 Analytics (Optional)

To track website usage, add Google Analytics or similar:

1. Create analytics account
2. Get tracking ID
3. Add to `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-ID');
</script>
```

---

## 🎨 Customizing the Website

### Update Landing Page

Edit `index.html` to add:
- Project description
- Screenshots
- Feature list
- Download buttons
- Documentation links

### Add Favicon

1. Create `favicon.ico` (16x16, 32x32, 48x48)
2. Place in `public/` folder
3. Reference in `index.html`:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
```

### Add Social Media Preview

Add to `index.html` `<head>`:

```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://umeinhardt.github.io/Staubfaenger/">
<meta property="og:title" content="3D Dust Particle Aggregation Simulation">
<meta property="og:description" content="Interactive 3D physics simulation with WebGPU acceleration">
<meta property="og:image" content="https://umeinhardt.github.io/Staubfaenger/preview.png">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://umeinhardt.github.io/Staubfaenger/">
<meta property="twitter:title" content="3D Dust Particle Aggregation Simulation">
<meta property="twitter:description" content="Interactive 3D physics simulation with WebGPU acceleration">
<meta property="twitter:image" content="https://umeinhardt.github.io/Staubfaenger/preview.png">
```

---

## 🚀 Next Steps

1. **Deploy website** (automatic on push to main)
2. **Create first release** (tag v1.0.0)
3. **Test both versions** (web and desktop)
4. **Share with users!**

---

## 📞 Support

If you encounter issues:

1. Check GitHub Actions logs
2. Review this guide
3. Check Electron Builder docs: https://www.electron.build/
4. Check Vite docs: https://vitejs.dev/

---

**Ready to deploy?** Start with the website (easiest):

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

Then visit: https://umeinhardt.github.io/Staubfaenger/ in 2-3 minutes!
