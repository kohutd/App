import AppEvents from "../../../../../../api/eventBus/AppEvents"
import AppSelectedPeer from "../../../../../reactive/SelectedPeer"
import AppSelectedInfoPeer from "../../../../../reactive/SelectedInfoPeer";
import {VComponent} from "../../../../../v/vrdom/component/VComponent"
import type {BusEvent} from "../../../../../../api/eventBus/EventBus"

class ChatInfoNameComponent extends VComponent {

    patchingStrategy = VRDOM.COMPONENT_PATCH_FAST

    callbacks = {
        peer: AppSelectedPeer.Reactive.PatchOnly
    }

    appEvents(E) {
        E.bus(AppEvents.Peers)
            .on("updateName", this.peersUpdateName)
    }

    h() {
        if (!this.callbacks.peer) {
            return (
                <div id="messages-title" className="title">
                    ...
                </div>
            )
        }

        const peer = this.callbacks.peer

        return (
            <div id="messages-title" className="title" onClick={this.openPeerInfo}>
                {peer.isSelf ? "Saved Messages" : peer.name}
            </div>
        )
    }

    peersUpdateName = (event: BusEvent) => {
        if (AppSelectedPeer.check(event.peer)) {
                this.__patch()
        }
    }

    openPeerInfo = () => {
        AppSelectedInfoPeer.select(this.callbacks.peer)
    }
}

export default ChatInfoNameComponent