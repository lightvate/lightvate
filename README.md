# [<img src="./browser/icon.png" width="40" align="left" alt="Lightvate">](https://github.com/lightvate/lightvate) Lightvate

[![Tests](https://github.com/lightvate/lightvate/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/lightvate/lightvate/actions/workflows/test.yml)

Lightvate is a Discord client mod based on [Vencord](https://github.com/Vendicated/Vencord) and [Equicord](https://github.com/Equicord/Equicord), with over 300+ plugins.

### Included Plugins

Lightvate includes all plugins from both Vencord and Equicord.

## Installing

### Manual Install (Recommended)

1. Download the latest `desktop.asar` from the [Releases](https://github.com/lightvate/lightvate/releases/latest) page.
2. Find your Discord installation's `resources` folder:
   - **Windows:** `%LocalAppData%\Discord\resources`
   - **macOS:** `/Applications/Discord.app/Contents/Resources`
   - **Linux:** `/opt/discord/resources` or `/usr/lib/discord/resources`
3. Rename the existing `app.asar` to `_app.asar` (backup).
4. Create a folder named `lightvate` inside `resources` and place `desktop.asar` inside it.
5. Replace `app.asar` with the loader from [Releases](https://github.com/lightvate/lightvate/releases/latest) (`app.asar` loader file).
6. Restart Discord.

### Build & Inject from Source

> See **Building Lightvate from Source** below.

## Uninstalling

1. Remove the `lightvate` folder from Discord's `resources` directory.
2. Delete the modified `app.asar`.
3. Rename `_app.asar` back to `app.asar`.
4. Restart Discord.

## Building Lightvate from Source

### Dependencies

[Git](https://git-scm.com/download) and [Node.JS LTS](https://nodejs.dev/en/) are required.

Install `pnpm`:

> :exclamation: This next command may need to be run as admin/root depending on your system, and you may need to close and reopen your terminal for pnpm to be in your PATH.

```shell
npm i -g pnpm
```

> :exclamation: **IMPORTANT** Make sure you aren't using an admin/root terminal from here onwards. It **will** mess up your Discord/Lightvate instance and you **will** most likely have to reinstall.

Clone Lightvate:

```shell
git clone https://github.com/lightvate/lightvate
cd lightvate
```

Install dependencies:

```shell
pnpm install --frozen-lockfile
```

Build Lightvate:

```shell
LIGHTVATE_REMOTE=https://github.com/lightvate/lightvate pnpm build
```

Inject Lightvate into your desktop client:

```shell
pnpm inject
```

Build Lightvate for web:

```shell
pnpm buildWeb
```

After building Lightvate's web extension, locate the appropriate ZIP file in the `dist` directory and follow your browser's guide for installing custom extensions, if supported.

Note: Firefox extension zip requires Firefox for developers.

## Credits

Thank you to [Vendicated](https://github.com/Vendicated) for creating [Vencord](https://github.com/Vendicated/Vencord) and the [Equicord](https://github.com/Equicord/Equicord) team for their work that Lightvate is built upon.

## Disclaimer

Discord is a trademark of Discord Inc., and solely mentioned for the sake of descriptivity.
Mentioning it does not imply any affiliation with or endorsement by Discord Inc.

<details>
<summary>Using Lightvate violates Discord's terms of service</summary>

Client modifications are against Discord's Terms of Service.

However, Discord is pretty indifferent about them and there are no known cases of users getting banned for using client mods! So you should generally be fine as long as you don't use plugins that implement abusive behaviour. But no worries, all inbuilt plugins are safe to use!

Regardless, if your account is essential to you and getting disabled would be a disaster for you, you should probably not use any client mods (not exclusive to Lightvate), just to be safe.

Additionally, make sure not to post screenshots with Lightvate in a server where you might get banned for it.

</details>
