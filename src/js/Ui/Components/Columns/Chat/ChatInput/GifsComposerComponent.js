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

import StatelessComponent from "../../../../../V/VRDOM/component/StatelessComponent"
import UIEvents from "../../../../EventBus/UIEvents"
import VComponent from "../../../../../V/VRDOM/component/VComponent"
import {FileAPI} from "../../../../../Api/Files/FileAPI"
import VRDOM from "../../../../../V/VRDOM/VRDOM"
import VApp from "../../../../../V/vapp"
import BetterVideoComponent from "../../../Basic/BetterVideoComponent"
import API from "../../../../../Api/Telegram/API"
import AppSelectedChat from "../../../../Reactive/SelectedChat"

class GifsComposerComponent extends StatelessComponent {
    masonryRef = VComponent.createRef();

    initialized = false;

    appEvents(E: AE) {
        E.bus(UIEvents.General)
            .on("composer.togglePanel", this.onComposerTogglePanel)
    }

    render(props) {
        return (
            <div className="gif-wrapper hidden">
                <div ref={this.masonryRef} className="gif-masonry scrollable"/>
            </div>
        )
    }

    componentDidMount() {

    }

    onComposerTogglePanel = event => {
        if (event.panel === "gif" && !this.initialized) {
            API.messages.getSavedGifs().then(SavedGifs => {
                SavedGifs.gifs.forEach(document => {
                    const size = FileAPI.getMaxSize(document);
                    const height = 100;
                    const width = Math.max((size.w / size.h) * height, 40);

                    VRDOM.append(
                        <div class="masonry-item" css-width={width + "px"}>
                            <BetterVideoComponent document={document}
                                                  onClick={() => {
                                                    AppSelectedChat.current.api.sendExistingMedia(document);
                                                    VApp.mountedComponents.get("composer").hide();
                                                  }}
                                                  playOnHover/>
                        </div>,
                        this.masonryRef.$el
                    );
                })
            });

            this.initialized = true;
        }
    }
}

export default GifsComposerComponent