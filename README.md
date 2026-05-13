# Predictor AI — Android App

Full-featured Android app with the **Hybrid AI Sequence Prediction System** and **?? cell guesser**, built in React Native and compiled automatically via **GitHub Actions** (free, no Android Studio needed).

---

## 📱 App Features

| Screen | What it does |
|--------|-------------|
| **Dashboard** | Overview of loaded data, today's top prediction, per-day stats |
| **Predict** | Full 9-engine ensemble results for any day of the week |
| **Import** | Load your `.xlsx` or `.csv` file directly on the phone |
| **Missing** | Auto-fill every `??` and `**` cell with AI guesses + alternatives |

---

## 🚀 Build Your APK Free (GitHub Actions)

### Step 1 — Create a GitHub repository

1. Go to [github.com](https://github.com) → **New repository**
2. Name it `PredictorApp` (or anything you like)
3. Set it to **Private** or Public — either works
4. Click **Create repository**

---

### Step 2 — Upload this project

**Option A — GitHub website (easiest):**
1. Open your new repo
2. Click **uploading an existing file**
3. Drag and drop the entire `PredictorApp` folder contents
4. Scroll down → **Commit changes**

**Option B — Git CLI:**
```bash
cd PredictorApp
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/PredictorApp.git
git push -u origin main
```

---

### Step 3 — Watch the build

1. In your GitHub repo, click the **Actions** tab
2. You'll see **"Build Android APK"** workflow running automatically
3. Wait ~8–12 minutes for the build to complete ✅

---

### Step 4 — Download your APK

**Method A — Artifacts (always available):**
1. Click the completed workflow run
2. Scroll to the bottom → **Artifacts**
3. Click **PredictorApp-APK** → downloads a zip
4. Unzip → you have `PredictorApp-signed.apk`

**Method B — GitHub Release (on every push to main):**
1. Click **Releases** on your repo sidebar
2. Find the latest release → download `PredictorApp-signed.apk` directly

---

### Step 5 — Install on your Android phone

1. On your Android phone: **Settings → Security → Install unknown apps → Allow**
2. Transfer the APK via USB, WhatsApp, Google Drive, or email to yourself
3. Tap the APK file → **Install**

---

## 📂 Project Structure

```
PredictorApp/
├── .github/
│   └── workflows/
│       └── build-apk.yml          ← GitHub Actions CI/CD
├── android/                        ← Native Android project
│   ├── app/
│   │   ├── build.gradle
│   │   ├── proguard-rules.pro
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/predictorapp/
│   │       │   ├── MainActivity.java
│   │       │   └── MainApplication.java
│   │       └── res/
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradle/wrapper/
├── src/
│   ├── AppContext.js               ← Global state
│   ├── screens/
│   │   ├── DashboardScreen.js      ← Main overview
│   │   ├── PredictScreen.js        ← Per-day predictions
│   │   ├── ImportScreen.js         ← File loader
│   │   └── MissingScreen.js        ← ?? cell guesser
│   └── utils/
│       ├── predictionEngine.js     ← All 6 AI engines
│       └── dataParser.js           ← CSV / XLSX parser
├── App.js                          ← Navigation
├── index.js
├── package.json
└── babel.config.js
```

---

## 🤖 AI Engines (JavaScript port)

| Engine | Description |
|--------|-------------|
| Multi-Scale Frequency | Short / medium / long exponential decay |
| 2nd-Order Markov | (pair[t-1], pair[t]) → pair[t+1] with 1st-order fallback |
| Bayesian (Log-Space) | Laplace-smoothed posterior, numerically stable |
| Weekday Table | Per-day frequency distribution |
| Monte Carlo | 5,000 importance-sampled rollouts |
| Dynamic Ensemble | Weighted combination of all engines |

---

## ⚙️ Trigger a New Build

Every `git push` to `main` triggers a fresh build automatically.

You can also trigger manually:
1. Go to **Actions** tab
2. Click **Build Android APK**
3. Click **Run workflow** → **Run workflow**

---

## 🔑 Production Signing (Optional)

The default build uses Android's debug keystore — perfectly fine for personal use.
For Play Store submission, add your own keystore as GitHub Secrets:

1. **Settings → Secrets and variables → Actions → New secret**
2. Add: `KEYSTORE_BASE64`, `KEY_ALIAS`, `KEY_PASSWORD`, `STORE_PASSWORD`
3. Update `build-apk.yml` to use these secrets in the signing step

---

## 🛠 Local Development (Optional)

If you want to run locally:

```bash
# Prerequisites: Node 20, JDK 17, Android Studio
npm install
npx react-native run-android
```

---

## 📋 Supported File Formats

Your data file should have columns: `MON  TUE  WED  THU  FRI  SAT  SUN`

- Numbers: `0` to `98`  
- Missing/unknown: `??` or `**`  
- Formats: `.xlsx`, `.xls`, `.csv`
