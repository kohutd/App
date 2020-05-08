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

import MessagesManager from "../../../Messages/MessagesManager"

function processUpdateEditMessage(update) {
    const to = MessagesManager.getToPeerMessage(update.message);

    if (to) {
        const message = to.dialog.peer.messages.getById(update.message.id);

        if (message) {
            message.fillRaw(update.message);

            // todo: fix events
            message.fire("edit");

            to.dialog.fire("editMessage", {
                message: message,
            });
        }
    } else {
        console.log("BUG: [processUpdateEditMessage] no peer found")
    }
}

export default processUpdateEditMessage;