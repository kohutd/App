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

import MTProto from "../../MTProto/External"

function getInlineBotResults(bot, chatPeer, query="", offset=0, geo_point = null) {
    return MTProto.invokeMethod("messages.getInlineBotResults", {
        bot,
        peer: chatPeer,
        query, 
        geo_point,
        offset
    })
}

const bot = {
    getInlineBotResults,
}

export default bot