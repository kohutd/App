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

import {initElement} from "../render/renderElement"
import VApp from "../../vapp"

function __component_mount(component, $el: HTMLElement) {
    initElement($el);

    if (component.__.mounted) {
        if (!VApp.mountedComponents.has(component.identifier)) {
            console.error("BUG: component with such id was not found!", component)
            VApp.mountedComponents.set(component.identifier, component)
        } else {
            component.$el = $el;
            component.$el.__v.component = component;

            component.forceUpdate();
        }
    } else {
        if (VApp.mountedComponents.has(component.identifier)) {
            console.error("BUG: component with such id already mounted!", component)
        } else {
            component.__.mounted = true;

            component.$el = $el;
            component.$el.__v.component = component;

            component.componentDidMount();

            VApp.mountedComponents.set(component.identifier, component)
        }

    }
}

export default __component_mount