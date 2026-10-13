# ChitChat | Testing, Build & Deployment Guide

## 1. Test Suite Status & Coverage

- **Automated Test Coverage**: **0% (Completely Absent)**.
- **Test Frameworks**: Neither Jest, Vitest, Cypress, Playwright, nor React Testing Library are installed or configured.
- **Test Scripts**: `package.json` contains no `"test"` script.
- **Untested Critical Paths**:
  1. `lib/socket-mock.ts`: BroadcastChannel message emission, presence exchange, room filtering.
  2. `lib/utils.ts`: Room code generator length, character set, formatting edge cases.
  3. `app/page.tsx`: SessionStorage hydration, form submission validation, message feed ordering.

---

## 2. Static Analysis & Linting Configuration

### TypeScript Configuration (`tsconfig.json`)
- **Version**: TypeScript `5.9.3` (locked in `package-lock.json`).
- **Mode**: `"strict": true`, `"noEmit": true`.
- **Target / Resolution**: `"moduleResolution": "bundler"`, `"isolatedModules": true`, `"skipLibCheck": true`.
- **Path Alias**: `"@/*": ["./*"]` allowing `@/lib/utils` and `@/lib/socket-mock`.

### ESLint Configuration
- **Version**: `eslint: 8.57.1`, `eslint-config-next: 14.2.3`.
- **Command**: `npm run lint` (executes `next lint`).
- **Scope**: Checks `.ts` and `.tsx` files in `app/`, `pages/`, and `components/`.

---

## 3. Build & Runtime Execution

### Commands Inventory

| Command | Script in `package.json` | Underlying Tool | Verified Behavior |
| :--- | :--- | :--- | :--- |
| `npm run dev` | `next dev --turbo` | Next.js 14 Turbopack | Starts local dev server at `http://localhost:3000` with fast refresh |
| `npm run build` | `next build` | Next.js Webpack / SWC | Compiles production assets and generates `.next/` directory |
| `npm run start` | `next start` | Next.js Node Server | Starts production server after build |
| `npm run lint` | `next lint` | ESLint + Next.js Plugin| Runs static ESLint checks |

---

## 4. Root Cause Analysis: `build_error.txt`

A diagnostic error log `build_error.txt` exists in the repository root.

### The Recorded Error
```
node.exe : ⚠ Disabling SWC Minifer will not be an option in the next major version.
▲ Next.js 14.2.3
Creating an optimized production build ...
Failed to compile.

app\layout.tsx
An error occurred in next/font.
Error: Cannot find module 'autoprefixer'
Require stack:
- C:\Users\adity\OneDrive\Desktop\chitchat\node_modules\next\dist\build\webpack\config\blocks\css\plugins.js
...
> Build failed because of webpack errors
```

### Forensic Root Cause
1. **Missing `autoprefixer` Dependency in `node_modules`**:
   While `package.json` specifies `"autoprefixer": "^10.4.27"` under `devDependencies`, the local `node_modules` on the author's machine was incomplete or corrupted.
2. **Next.js Google Font PostCSS Pipeline**:
   When Next.js 14 compiles `next/font/google` (`Inter`), it passes styles through the PostCSS plugin chain (`postcss.config.js`). PostCSS required `autoprefixer`, which threw a `MODULE_NOT_FOUND` error.
3. **OneDrive File Locking Hazard**:
   The author was working in `C:\Users\adity\OneDrive\Desktop\chitchat`. OneDrive file synchronization frequently locks files in `node_modules` during `npm install`, causing incomplete package extractions.
4. **Remediation**:
   Run a clean install (`npm ci` or `npm install`) outside of cloud-synced folders before executing `npm run build`.

---

## 5. Runtime & Operating System Specifics

### Node.js v24 Compatibility
- The current workstation runs **Node.js `v24.21.0`**.
- In `next.config.js`:
  ```javascript
  swcMinify: false, // Disabling SWC minifier to bypass potential Node v24 compatibility issues
  ```
- **Warning**: Next.js 14 emits a deprecation warning regarding `swcMinify: false`. When upgrading to Next.js 15+, SWC minification is mandatory and this flag will cause build errors.

### Windows PowerShell Script Execution Policy
On Windows systems, running `npm` via PowerShell may be blocked by execution policies:
```powershell
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```
**Workaround**:
Invoke the Windows Command batch wrapper:
```powershell
npm.cmd run dev
npm.cmd run build
```

---

## 6. Deployment Architecture & Hosting Constraints

1. **Vercel / Static Hosting**:
   - Because the application has no server routes and no database, it can be deployed to Vercel, Netlify, Cloudflare Pages, or AWS Amplify.
   - However, **remember**: Cross-device and cross-network chat will NOT function! Real-time messaging only works between tabs open in the same browser on the same physical machine via `BroadcastChannel`.
2. **Real-Time Deployment Upgrade Requirements**:
   To support real cross-user communication across the internet, the deployment requires:
   - A persistent Node.js / WebSocket server (e.g., Socket.IO or AWS API Gateway WebSockets).
   - Alternatively, a managed real-time service like Pusher, Ably, or Supabase Realtime.
