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

import PeersStore from "../../../Store/PeersStore";
import UpdatesManager from "../../UpdatesManager";
import MessagesManager from "../../../Messages/MessagesManager";
import AppEvents from "../../../EventBus/AppEvents"

function processUpdateShortMessage(update) {
    const user = PeersStore.get("user", update.user_id);

    if (!user) {
        UpdatesManager.defaultUpdatesProcessor.getDifference({
            pts: UpdatesManager.State.pts - 1,
        }).then(diff => {
            UpdatesManager.defaultUpdatesProcessor.processDifference(diff);
        })
    } else {
        MessagesManager.processNewMessage(user, update);
    }

    AppEvents.Telegram.fire("updateShortMessage", update);
}

export default processUpdateShortMessage;