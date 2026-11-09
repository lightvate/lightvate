# [<img src="./browser/icon.png" width="40" align="left" alt="Lightvate">](https://github.com/lightvate/lightvate) Lightvate

[![Tests](https://github.com/lightvate/lightvate/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/lightvate/lightvate/actions/workflows/test.yml)

Lightvate is a Discord client mod based on [Vencord](https://github.com/Vendicated/Vencord) and [Equicord](https://github.com/Equicord/Equicord), with over 300+ plugins.

### Included Plugins

Lightvate includes all plugins from both Vencord and Equicord — over 300+ plugins total.

---

## After Installing

Once Lightvate is injected, **Discord's window appearance stays the same by design** — Lightvate works inside Discord, not on top of it.

To confirm it's working and access all features:

1. Open Discord.
2. Go to **User Settings** (⚙️ gear icon, bottom-left).
3. Scroll down in the sidebar — you will see a **Lightvate** section with:
   - **Plugins** — enable/disable and configure plugins.
   - **Themes** — load custom CSS themes.
   - **Updater** — keep Lightvate up to date.
   - **Backup & Restore** — save your settings.

> The system tray icon will also show the Lightvate logo when Discord is minimized.

---

## Managing Plugins

### Enabling Built-in Plugins

1. Open Discord → Settings → **Lightvate** → **Plugins**.
2. Browse the list of 300+ plugins.
3. Click the toggle next to any plugin to enable or disable it.
4. Some plugins have a ⚙️ settings icon — click it to configure them.

### Installing Custom (User) Plugins

1. In Settings → Lightvate → Plugins, enable the **UserPlugins** plugin (or **UserpluginInstaller**).
2. Once enabled, a new option appears to load `.js` or `.ts` plugin files from your computer.
3. Place your custom plugin file anywhere on your disk.
4. Click **Load Plugin** and select the file.

> Custom plugins are loaded from your local disk and are not bundled with Lightvate.

### Popular Built-in Plugin Categories

| Category | Examples |
|---|---|
| Chat | BetterRoleDot, MessageLogger, ReplyTimestamp |
| Voice | VoiceDownload, SilentTyping, PushToTalk |
| UI | FullSearchContext, GreetStickerPicker, NoDevtoolsWarning |
| Nitro | FakeNitro, IgnoreActivities |
| Privacy | AnonymiseFileNames, NoTypingAnimation |
| Fun | GifPaste, Snowfall, Translate |

---

## Installing

### Build & Inject from Source (Windows)

**Requirements:** [Git](https://git-scm.com/download) and [Node.JS LTS](https://nodejs.org/en/download)

**Step 1 — Install pnpm** (open a new terminal after):

```cmd
powershell -c "iwr https://get.pnpm.io/install.ps1 -useb | iex"
```

> Open a **new** terminal window after this step.

**Step 2 — Clone and build:**

```cmd
git clone https://github.com/lightvate/lightvate
cd lightvate
pnpm install --frozen-lockfile
set LIGHTVATE_REMOTE=https://github.com/lightvate/lightvate && pnpm build
```

**Step 3 — Inject into Discord:**

```cmd
pnpm inject
```

> :exclamation: **Do not run as Administrator** — it will break your Discord installation.

**Step 4 — Restart Discord.** Done!

### macOS / Linux

```shell
git clone https://github.com/lightvate/lightvate
cd lightvate
pnpm install --frozen-lockfile
LIGHTVATE_REMOTE=https://github.com/lightvate/lightvate pnpm build
pnpm inject
```

---

## Uninstalling

```cmd
pnpm uninject
```

Or manually:
1. Go to `%LocalAppData%\Discord\resources` (Windows).
2. Delete the modified `app.asar`.
3. Rename `_app.asar` back to `app.asar`.
4. Restart Discord.

---

## Updating

To update Lightvate after a new release:

```cmd
cd lightvate
git pull
pnpm install --frozen-lockfile
set LIGHTVATE_REMOTE=https://github.com/lightvate/lightvate && pnpm build
pnpm inject
```

---

## Browser Extension

```shell
pnpm buildWeb
```

After building, locate the ZIP file in the `dist` directory and load it as an unpacked extension in your browser's extension settings.

> Firefox extension ZIP requires Firefox Developer Edition.

---

## Credits

Thank you to [Vendicated](https://github.com/Vendicated) for creating [Vencord](https://github.com/Vendicated/Vencord) and the [Equicord](https://github.com/Equicord/Equicord) team for their work that Lightvate is built upon.

---

## Disclaimer

Discord is a trademark of Discord Inc., and solely mentioned for the sake of descriptivity.
Mentioning it does not imply any affiliation with or endorsement by Discord Inc.

<details>
<summary>Using Lightvate violates Discord's terms of service</summary>

Client modifications are against Discord's Terms of Service.

However, Discord is pretty indifferent about them and there are no known cases of users getting banned for using client mods. You should generally be fine as long as you don't use plugins that implement abusive behaviour. All built-in plugins are safe to use.

Regardless, if your account is essential to you and getting disabled would be a disaster, you should probably not use any client mods (not exclusive to Lightvate), just to be safe.

Additionally, make sure not to post screenshots with Lightvate in a server where you might get banned for it.

</details>
