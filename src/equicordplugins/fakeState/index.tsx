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

const VoiceActions = findByPropsLazy("toggleSelfMute", "toggleSelfDeaf");

const settings = definePluginSettings({
    fakeMute: {
        type: OptionType.BOOLEAN,
        description: "Appear muted to others while still being able to speak.",
        default: false,
        restartNeeded: false,
        onChange: () => applyFakeState()
    },
    fakeDeaf: {
        type: OptionType.BOOLEAN,
        description: "Appear deafened to others while still being able to hear.",
        default: false,
        restartNeeded: false,
        onChange: () => applyFakeState()
    }
});

function applyFakeState() {
    FluxDispatcher.dispatch({ type: "AUDIO_SET_SELF_MUTE", mute: settings.store.fakeMute });
    FluxDispatcher.dispatch({ type: "AUDIO_SET_SELF_DEAF", deaf: settings.store.fakeDeaf });
}

export default definePlugin({
    name: "FakeState",
    description: "Appear muted or deafened to others in voice channels without actually affecting your audio.",
    authors: [EquicordDevs.thororen],
    settings,

    patches: [
        {
            // Intercept outgoing voice state gateway payload to override self_mute
            find: '"self_mute"',
            replacement: {
                match: /self_mute:(\i\.isSelfMute\(\))/,
                replace: "self_mute:($self.isFakeMute()||$1)"
            }
        },
        {
            // Intercept outgoing voice state gateway payload to override self_deaf
            find: '"self_deaf"',
            replacement: {
                match: /self_deaf:(\i\.isSelfDeaf\(\))/,
                replace: "self_deaf:($self.isFakeDeaf()||$1)"
            }
        }
    ],

    isFakeMute(): boolean {
        return settings.store.fakeMute;
    },

    isFakeDeaf(): boolean {
        return settings.store.fakeDeaf;
    }
});
