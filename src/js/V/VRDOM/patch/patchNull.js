/*
 * Telegram V
 * Copyright (C) 2020 Davyd Kohut
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
import vrdom_deleteInner from "../deleteInner"
import {initElement} from "../render/renderElement"
import __component_unmount from "../component/__component_unmount"

const patchVRNodeNull = ($node: Element) => {
    initElement($node)

    if ($node.__v && $node.__v.component) {
        __component_unmount($node.__v.component)
    }

    vrdom_deleteInner($node)

    const $newNode = document.createTextNode("")
    $node.replaceWith($newNode)

    return $newNode
}

export default patchVRNodeNull