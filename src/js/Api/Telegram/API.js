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

import auth from "./auth"
import messages from "./messages"
import contacts from "./contacts"
import upload from "./upload"
import channels from "./channels"
import account from "./account"
import langpack from "./langpack"
import bot from "./bot"

const API = {
    auth,
    account,
    messages,
    channels,
    contacts,
    upload,
    lang: langpack,
    bot,
}

export default API