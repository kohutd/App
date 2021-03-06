/*
 * Telegram V
 * Copyright (C) 2020 original authors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import PeersStore from "../../Store/PeersStore";
import {UserPeer} from "../../Peers/Objects/UserPeer";
import AppEvents from "../../EventBus/AppEvents"

function processUpdateUserPinnedMessage(update) {
    const peer = PeersStore.get("user", update.user_id);

    if (!peer) {
        console.warn("BUG: [processUpdateUserPinnedMessage] no peer found");
        return;
    }

    if (peer instanceof UserPeer) {
        peer.pinnedMessageId = update.id;
    }

    AppEvents.Telegram.fire("updateUserPinnedMessage", update);
}

export default processUpdateUserPinnedMessage;