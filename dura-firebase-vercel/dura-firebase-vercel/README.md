# DURA 壓瘡危險性評估系統

這是一個可部署的 React + Firebase 網站，依照 DURA 系統分析圖製作成實際可操作的期末專案。

## 已完成的功能

- HEPS 醫療企業入口網站登入頁
- Firebase Authentication：Email / Password 登入與註冊
- NNS 護理紀錄系統：依院區、病房、關鍵字查詢病患
- DURA 子系統：設定紀錄日期時間、填寫壓瘡風險評估表
- 自動計算 DURA Score 與風險等級
- 儲存 DURA 紀錄到 Firestore
- 查詢 DURA 歷史紀錄
- 列印 DURA 評估表
- 行動機器人輔助功能：服務對話紀錄、翻譯示範、護理摘要、藥物配送紀錄
- 沒有設定 Firebase 時，會使用 localStorage 本機示範模式，方便先看畫面

> 注意：DURA 評分規則是課堂展示用示範規則，不可直接作為真實醫療判斷依據。若老師有指定正式 DURA 表單，只要修改 `src/duraRules.js` 即可。

## 一、在本機執行

### 1. 安裝 Node.js

建議使用 Node.js 18 以上版本。

### 2. 安裝套件

```bash
npm install
```

### 3. 設定 Firebase 環境變數

複製 `.env.example` 成 `.env.local`：

```bash
cp .env.example .env.local
```

Windows PowerShell 可用：

```powershell
Copy-Item .env.example .env.local
```

打開 `.env.local`，填入 Firebase Web App Config：

```env
VITE_FIREBASE_API_KEY=你的_apiKey
VITE_FIREBASE_AUTH_DOMAIN=你的專案.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=你的_projectId
VITE_FIREBASE_STORAGE_BUCKET=你的專案.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=你的_senderId
VITE_FIREBASE_APP_ID=你的_appId
```

### 4. 啟動網站

```bash
npm run dev
```

打開終端機顯示的網址，通常是：

```text
http://localhost:5173
```

## 二、建立 Firebase 後端

### 1. 建立 Firebase 專案

1. 到 Firebase Console 建立新專案。
2. 進入 Project settings。
3. 新增 Web App。
4. 複製 Firebase config 到 `.env.local`。

### 2. 開啟 Authentication

1. 左側選單選 Authentication。
2. 點選 Get started。
3. 到 Sign-in method。
4. 啟用 Email/Password。

### 3. 建立 Firestore Database

1. 左側選單選 Firestore Database。
2. 點選 Create database。
3. 選 Production mode 或 Test mode 都可以。
4. Location 選離你較近的區域。

### 4. 設定 Firestore Security Rules

在 Firebase Console 的 Firestore Rules 貼上本專案的 `firestore.rules` 內容：

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    match /patients/{patientId} {
      allow read, write: if signedIn();
    }

    match /duraRecords/{recordId} {
      allow read, create, update, delete: if signedIn();
    }

    match /serviceRecords/{recordId} {
      allow read, create, update, delete: if signedIn();
    }

    match /nursingSummaries/{summaryId} {
      allow read, create, update, delete: if signedIn();
    }

    match /medicationDispatches/{dispatchId} {
      allow read, create, update, delete: if signedIn();
    }
  }
}
```

## 三、使用網站

1. 第一次使用請按「註冊」。
2. 登入後在「HEPS 入口」按「建立 / 更新示範病患資料」。
3. 到「NNS 病患清單」選擇病患。
4. 系統會進入「DURA 評估」，填寫各項分數。
5. 右側會自動計算 DURA Score、風險等級與照護建議。
6. 按「儲存 DURA 紀錄」。
7. 到「歷史紀錄」即可查詢剛剛儲存的資料。
8. 按「列印評估表」可輸出紙本或另存 PDF。
9. 到「行動機器人」可測試服務對話紀錄、翻譯、護理摘要與藥物配送。

## 四、部署到 Vercel

### 方式 A：用 GitHub + Vercel 網站部署

1. 把整個資料夾上傳到 GitHub repository。
2. 到 Vercel 建立 New Project。
3. 選擇你的 GitHub repository。
4. Framework Preset 選 Vite。
5. Build Command 保持：

```bash
npm run build
```

6. Output Directory 保持：

```bash
dist
```

7. 到 Environment Variables 加入 `.env.local` 內所有 `VITE_FIREBASE_` 開頭的變數。
8. 按 Deploy。

### 方式 B：用 Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

第一次部署後，如果要正式網址：

```bash
vercel --prod
```

## 五、專案結構

```text
dura-firebase-vercel/
├── src/
│   ├── App.jsx           # 主要畫面與功能流程
│   ├── demoData.js       # 示範病患資料
│   ├── duraRules.js      # DURA 分數計算、風險等級、護理建議
│   ├── firebase.js       # Firebase Auth / Firestore 與本機示範模式
│   ├── main.jsx          # React 入口
│   └── styles.css        # 網站樣式
├── .env.example          # Firebase 環境變數範本
├── firestore.rules       # Firestore 安全規則
├── firebase.json         # Firebase 設定
├── index.html
├── package.json
├── vercel.json           # Vercel SPA rewrite 設定
└── vite.config.js
```

## 六、可以放進報告的系統說明

本系統以前端 React + Vite 實作，並部署至 Vercel。後端採用 Firebase，使用 Firebase Authentication 管理護理師登入，Cloud Firestore 儲存病患資料、DURA 評估紀錄、行動機器人服務紀錄、護理摘要與藥物配送紀錄。系統流程對應原始 UML：護理師由 HEPS 入口登入，進入 NNS 護理紀錄系統查詢住院病患清單，選擇病患後進入 DURA 子系統填寫壓瘡風險評估表。系統會自動計算 DURA Score，產生低、中、高風險結果與護理建議，並可儲存、查詢歷史紀錄與列印評估表。另外也加入行動機器人的示範模組，提供自動記錄服務對話、產生護理摘要、翻譯與藥物配送紀錄，以符合系統規劃圖中的雲端與 AI 輔助功能。
