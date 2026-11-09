/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";

const MediaEngine = findByPropsLazy("setLocalMute", "setLocalVolume");
const SelfMediaOptions = findByPropsLazy("toggleSelfMute", "toggleSelfDeaf");

const settings = definePluginSettings({
    fakeMute: {
        type: OptionType.BOOLEAN,
        description: "Appear muted to others while still being able to speak locally.",
        default: false,
        restartNeeded: false,
    },
    fakeDeaf: {
        type: OptionType.BOOLEAN,
        description: "Appear deafened to others while still being able to hear locally.",
        default: false,
        restartNeeded: false,
    }
});

export default definePlugin({
    name: "FakeState",
    description: "Appear muted or deafened to others in voice channels without affecting your own audio.",
    authors: [EquicordDevs.thororen],
    tags: ["voice", "mute", "deafen", "fake"],
    settings,

    patches: [
        {
            find: "self_mute",
            replacement: {
                match: /self_mute:(\i)\.isSelfMute\(\)/,
                replace: "self_mute:($self.settings.store.fakeMute||$1.isSelfMute())"
            }
        },
        {
            find: "self_mute",
            replacement: {
                match: /self_deaf:(\i)\.isSelfDeaf\(\)/,
                replace: "self_deaf:($self.settings.store.fakeDeaf||$1.isSelfDeaf())"
            }
        }
    ]
});
