/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher } from "@webpack/common";

const MediaActions = findByPropsLazy("toggleSelfMute", "toggleSelfDeaf");

const settings = definePluginSettings({
    fakeMute: {
        type: OptionType.BOOLEAN,
        description: "Appear muted to others while still being able to speak.",
        default: false,
        restartNeeded: false,
        onChange() {
            MediaActions.toggleSelfMute();
            MediaActions.toggleSelfMute();
        }
    },
    fakeDeaf: {
        type: OptionType.BOOLEAN,
        description: "Appear deafened to others while still being able to hear.",
        default: false,
        restartNeeded: false,
        onChange() {
            MediaActions.toggleSelfDeaf();
            MediaActions.toggleSelfDeaf();
        }
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
            find: "updateVoiceStateForChannel",
            replacement: {
                match: /(self_mute\s*:)\s*(\i\.isSelfMute\b[^,}]*)/,
                replace: "$1($self.settings.store.fakeMute||$2)"
            }
        },
        {
            find: "updateVoiceStateForChannel",
            replacement: {
                match: /(self_deaf\s*:)\s*(\i\.isSelfDeaf\b[^,}]*)/,
                replace: "$1($self.settings.store.fakeDeaf||$2)"
            }
        }
    ]
});
