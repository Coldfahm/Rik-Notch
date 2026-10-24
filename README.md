# Rik Notch

Rik Notch is an interactive desktop prototype for a compact, expandable notch-style
control surface. The React UI demonstrates media controls, focus timers, quick
toggles, a file shelf, and a developer panel. Tauri packages it as a native
Windows desktop application.

> **Prototype status:** the current media playback, audio visualization, system
> readings, hardware toggles, port checks, and script actions are demonstrations.
> They do not control Windows or execute system commands. The Rust media and
> audio modules are scaffolding and are not wired into the application yet.

## Run in a browser

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```powershell
npm ci
npm run dev
```

Open <http://localhost:3000>.

## Build the Windows app

Requirements:

- Windows 10 or 11
- Node.js 20.19+ (or 22.12+) and npm
- Rust stable with the `x86_64-pc-windows-msvc` target
- Microsoft C++ Build Tools (MSVC and Windows SDK)
- WebView2 Runtime

```powershell
npm ci
npm run tauri:dev
```

To build the optimized executable and NSIS installer:

```powershell
npm run tauri:build
```

Build outputs:

- `src-tauri/target/release/rik-notch.exe` — portable app executable
- `src-tauri/target/release/bundle/nsis/` — Windows installer

The first native build downloads Rust crates and may take several minutes. The
Windows GitHub Actions workflow builds both outputs and publishes them as a
workflow artifact.

## Checks

```powershell
npm run lint
npm run build
```

## Project layout

- `src/` — React interface and prototype interactions
- `src-tauri/` — Tauri v2 desktop application and native-integration scaffolding
- `src-tauri/tauri.conf.json` — app window and Windows packaging configuration
