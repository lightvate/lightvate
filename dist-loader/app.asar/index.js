"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ipcMain, app, powerSaveBlocker } = require("electron");

[
    "disable-renderer-backgrounding",
    "disable-background-timer-throttling",
    "disable-backgrounding-occluded-windows"
].forEach((flag) => {
    try { app.commandLine.appendSwitch(flag); } catch {}
});
try {
    app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion,IntensiveWakeUpThrottling");
} catch {}
try { powerSaveBlocker.start("prevent-app-suspension"); } catch {}

const lightvateDir = path.join(__dirname, "..", "lightvate");
const desktopAsar = path.join(lightvateDir, "desktop.asar");
const patcherJs = path.join(lightvateDir, "patcher.js");
const vanilla = path.join(__dirname, "..", "_app.asar");
const logPath = path.join(__dirname, "..", "lightvate-load.log");
const stampPath = path.join(lightvateDir, ".update-stamp");

const GITHUB_API = "https://api.github.com/repos/lightvate/lightvate";
const ASSET_NAME = "desktop.asar";
const USER_AGENT = "Lightvate/Lightvate (https://github.com/lightvate/lightvate)";

function wipeNativeCwdLogs() {
    const names = ["discord_krisp.log", "discord_utils.log"];
    const dirs = new Set();
    try { dirs.add(process.cwd()); } catch {}
    try { dirs.add(path.dirname(process.execPath)); } catch {}
    for (const dir of dirs) {
        for (const name of names) {
            try { fs.unlinkSync(path.join(dir, name)); } catch {}
        }
    }
}
wipeNativeCwdLogs();

function log(message, extra) {
    const line = `[${new Date().toISOString()}] ${message}${extra ? " " + extra : ""}\n`;
    try { fs.appendFileSync(logPath, line); } catch {}
    try { console.log("[Lightvate]", message, extra || ""); } catch {}
}

function currentGitHash() {
    try {
        const header = fs.readFileSync(patcherJs, "utf8").split("\n", 1)[0];
        const match = header.match(/Lightvate\s+([a-f0-9]{7,40})/i);
        if (match) return match[1];
    } catch {}
    return "HEAD";
}

function sleepSync(ms) {
    try {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
        return;
    } catch {}
    const end = Date.now() + ms;
    while (Date.now() < end) {}
}

function withoutAsar(fn) {
    // Electron's fs wrapper opens *.asar files and keeps them locked.
    // Checking or replacing desktop.asar has to bypass that.
    const prev = process.noAsar;
    process.noAsar = true;
    try {
        return fn();
    } finally {
        process.noAsar = prev;
    }
}

function makeWritable(file) {
    try { fs.chmodSync(file, 0o666); } catch {}
}

// Windows rename() cannot replace an existing file, and the previous client
// keeps desktop.asar locked until it fully exits. Move the old file aside,
// then retry while that lock drops.
function replaceFile(src, dest) {
    return withoutAsar(() => {
        const backup = dest + ".old";
        makeWritable(backup);
        try { fs.rmSync(backup, { force: true }); } catch {}

        let movedAside = false;
        if (fs.existsSync(dest)) {
            makeWritable(dest);
            try {
                fs.renameSync(dest, backup);
                movedAside = true;
            } catch {
                try { fs.rmSync(dest, { force: true }); } catch {}
            }
        }
        if (fs.existsSync(dest)) {
            const err = new Error("EPERM: desktop.asar is still in use");
            err.code = "EPERM";
            throw err;
        }
        try {
            fs.renameSync(src, dest);
        } catch (err) {
            if (movedAside && !fs.existsSync(dest)) {
                try { fs.renameSync(backup, dest); } catch {}
            }
            throw err;
        }
        makeWritable(backup);
        try { fs.rmSync(backup, { force: true }); } catch {}
    });
}

function sha256File(file) {
    const buf = withoutAsar(() => fs.readFileSync(file));
    return crypto.createHash("sha256").update(buf).digest("hex");
}

function readMeta(file) {
    try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

function applyPendingUpdate() {
    const pending = desktopAsar + ".new";
    const metaPath = pending + ".meta";
    if (!withoutAsar(() => fs.existsSync(pending))) return false;
    const meta = readMeta(metaPath);
    if (meta && meta.sha256) {
        try {
            const got = sha256File(pending);
            if (got.toLowerCase() !== String(meta.sha256).toLowerCase()) {
                log("Pending Lightvate update failed SHA-256 check; keeping current desktop.asar");
                return false;
            }
        } catch (err) {
            log("Could not hash pending Lightvate update:", err && err.stack || String(err));
            return false;
        }
    }
    const deadline = Date.now() + 1500;
    let lastErr = null;
    for (;;) {
        try {
            replaceFile(pending, desktopAsar);
            withoutAsar(() => {
                try { fs.rmSync(path.join(lightvateDir, "desktop.update.asar"), { force: true }); } catch {}
                try { fs.rmSync(metaPath, { force: true }); } catch {}
            });
            if (meta && meta.stamp) {
                try { fs.writeFileSync(stampPath, meta.stamp); } catch {}
            }
            log("Applied pending Lightvate update" + (meta && meta.sha256 ? " (SHA-256 matched GitHub)" : ""));
            return true;
        } catch (err) {
            lastErr = err;
            const code = err && err.code;
            if ((code === "EPERM" || code === "EBUSY" || code === "EACCES") && Date.now() < deadline) {
                sleepSync(200);
                continue;
            }
            log("Failed to apply pending Lightvate update:", lastErr && lastErr.stack || String(lastErr));
            return false;
        }
    }
}

function readStamp() {
    try { return fs.readFileSync(stampPath, "utf8").trim(); } catch { return ""; }
}

async function githubJson(endpoint) {
    const res = await fetch(GITHUB_API + endpoint, {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": USER_AGENT
        }
    });
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`${endpoint}: ${res.status} ${res.statusText}${body ? "\n" + body : ""}`);
    }
    return res.json();
}

let pendingDownloadUrl = null;
let pendingStamp = null;
let pendingSha = null;

function assetSha256(asset) {
    const digest = String(asset && asset.digest || "");
    const match = digest.match(/sha256:([a-f0-9]{64})/i);
    return match ? match[1].toLowerCase() : "";
}

async function checkForLightvateUpdate() {
    const release = await githubJson("/releases/latest");
    const asset = (release.assets || []).find(item => item.name === ASSET_NAME);
    if (!asset || !asset.browser_download_url) return false;

    const remoteSha = assetSha256(asset);
    const stamp = `${asset.id}@${asset.updated_at || release.published_at || ""}`;
    let localSha = "";
    try {
        if (withoutAsar(() => fs.existsSync(desktopAsar))) localSha = sha256File(desktopAsar);
    } catch {}

    if (remoteSha && localSha && remoteSha === localSha.toLowerCase()) {
        if (readStamp() !== stamp) {
            try { fs.writeFileSync(stampPath, stamp); } catch {}
        }
        return false;
    }

    if (!remoteSha) {
        const name = String(release.name || "").trim();
        const nameHash = name.slice(name.lastIndexOf(" ") + 1);
        const hash = currentGitHash();
        if (nameHash && (nameHash === hash || hash.startsWith(nameHash) || nameHash === hash.slice(0, 7))) {
            return false;
        }
        if (readStamp() === stamp && withoutAsar(() => fs.existsSync(desktopAsar))) return false;
    }

    pendingDownloadUrl = asset.browser_download_url;
    pendingStamp = stamp;
    pendingSha = remoteSha || null;
    return true;
}

async function getLightvateChanges() {
    if (!await checkForLightvateUpdate()) return [];
    try {
        const data = await githubJson(`/compare/${currentGitHash()}...HEAD`);
        return (data.commits || []).map(commit => ({
            hash: commit.sha,
            author: commit.author?.login ?? commit.commit?.author?.name ?? "Ghost",
            message: String(commit.commit?.message || "Update").split("\n")[0]
        }));
    } catch {
        return [{ hash: "latest", author: "Lightvate", message: "Latest Lightvate release" }];
    }
}

async function applyLightvateUpdate() {
    if (!pendingDownloadUrl) {
        const outdated = await checkForLightvateUpdate();
        if (!outdated) return true;
    }
    const res = await fetch(pendingDownloadUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const got = crypto.createHash("sha256").update(buf).digest("hex");
    if (pendingSha && got.toLowerCase() !== pendingSha.toLowerCase()) {
        throw new Error("SHA-256 does not match GitHub's published hash");
    }
    fs.mkdirSync(lightvateDir, { recursive: true });
    const tmp = desktopAsar + ".tmp";
    const neu = desktopAsar + ".new";
    fs.writeFileSync(tmp, buf);
    try { fs.unlinkSync(neu); } catch {}
    fs.renameSync(tmp, neu);
    fs.writeFileSync(neu + ".meta", JSON.stringify({
        stamp: pendingStamp || "",
        sha256: got
    }));
    pendingDownloadUrl = null;
    log("Lightvate update downloaded; restart will apply it");
    return true;
}

function serializeErrors(fn) {
    return async function serialized() {
        try {
            return { ok: true, value: await fn(...arguments) };
        } catch (err) {
            return {
                ok: false,
                error: err instanceof Error
                    ? { message: err.message, name: err.name, stack: err.stack }
                    : err
            };
        }
    };
}

function installUpdaterOverrides() {
    for (const channel of ["VencordGetUpdates", "VencordUpdate", "VencordBuild"]) {
        try { ipcMain.removeHandler(channel); } catch {}
    }
    ipcMain.handle("VencordGetUpdates", serializeErrors(getLightvateChanges));
    ipcMain.handle("VencordUpdate", serializeErrors(checkForLightvateUpdate));
    ipcMain.handle("VencordBuild", serializeErrors(applyLightvateUpdate));
    log("Installed Lightvate updater overrides");
}

function relaunchApp() {
    try {
        if (process.platform === "win32") {
            const cp = require("child_process");
            const os = require("os");
            const args = process.argv.slice(1).filter((arg) => arg && arg !== "--");
            const psQuote = (value) => "'" + String(value).replace(/'/g, "''") + "'";
            const exeName = path.basename(process.execPath, path.extname(process.execPath));
            const pending = desktopAsar + ".new";
            const meta = readMeta(pending + ".meta") || {};
            const script = [
                "$ErrorActionPreference = 'Continue'",
                "$name = " + psQuote(exeName),
                "for ($i = 0; $i -lt 80; $i++) {",
                "  if (-not (Get-Process -Name $name -ErrorAction SilentlyContinue)) { break }",
                "  Start-Sleep -Milliseconds 250",
                "}",
                "Start-Sleep -Milliseconds 800",
                "$src = " + psQuote(pending),
                "$dest = " + psQuote(desktopAsar),
                "if (Test-Path -LiteralPath $src) {",
                "  for ($i = 0; $i -lt 40; $i++) {",
                "    try {",
                "      if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Force }",
                "      Move-Item -LiteralPath $src -Destination $dest -Force",
                "      break",
                "    } catch { Start-Sleep -Milliseconds 400 }",
                "  }",
                "}",
                meta.stamp ? ("Set-Content -LiteralPath " + psQuote(stampPath) + " -Value " + psQuote(meta.stamp) + " -Encoding ascii") : "",
                "Remove-Item -LiteralPath " + psQuote(pending + ".meta") + " -Force -ErrorAction SilentlyContinue",
                "Start-Process -FilePath " + psQuote(process.execPath) +
                    (args.length ? " -ArgumentList @(" + args.map(psQuote).join(",") + ")" : "")
            ].filter(Boolean).join("\r\n");
            const scriptPath = path.join(os.tmpdir(), "lightvate-relaunch-" + process.pid + ".ps1");
            fs.writeFileSync(scriptPath, script, "utf8");
            cp.spawn("powershell.exe", [
                "-NoProfile",
                "-ExecutionPolicy", "Bypass",
                "-WindowStyle", "Hidden",
                "-File", scriptPath
            ], {
                detached: true,
                stdio: "ignore",
                windowsHide: true
            }).unref();
            setTimeout(() => {
                try { app.exit(0); } catch { try { app.quit(); } catch {} }
            }, 300);
            return;
        }
        app.relaunch({
            execPath: process.execPath,
            args: process.argv.slice(1)
        });
        setTimeout(() => app.exit(0), 250);
    } catch {
        try {
            app.relaunch();
            app.exit(0);
        } catch {}
    }
}

const nativeRelaunch = app.relaunch.bind(app);
app.relaunch = function (options) {
    if (withoutAsar(() => fs.existsSync(desktopAsar + ".new"))) {
        relaunchApp();
        return;
    }
    return nativeRelaunch(options);
};

const updateApplied = applyPendingUpdate();

let loaded = false;
const candidates = [];
const pendingAsar = desktopAsar + ".new";
if (!updateApplied && withoutAsar(() => fs.existsSync(pendingAsar))) {
    const fallback = path.join(lightvateDir, "desktop.update.asar");
    try {
        withoutAsar(() => fs.copyFileSync(pendingAsar, fallback));
        candidates.push(fallback);
        log("Could not replace desktop.asar yet; loading the staged update");
    } catch (err) {
        log("Could not load the staged Lightvate update:", err && err.stack || String(err));
    }
}
if (withoutAsar(() => fs.existsSync(desktopAsar))) candidates.push(desktopAsar);
if (fs.existsSync(patcherJs)) candidates.push(patcherJs);

for (const file of candidates) {
    try {
        log("Loading Lightvate from", file);
        require(file);
        loaded = true;
        break;
    } catch (err) {
        log("Lightvate failed to load from " + file + ":", err && err.stack || String(err));
    }
}

if (!loaded) {
    log("Starting vanilla Discord");
    require(vanilla);
} else {
    try {
        installUpdaterOverrides();
    } catch (err) {
        log("Failed to install Lightvate updater overrides:", err && err.stack || String(err));
    }
    try {
        ipcMain.removeHandler("VencordRelaunch");
    } catch {}
    ipcMain.handle("VencordRelaunch", async () => relaunchApp());
}
