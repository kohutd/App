import DialogsManager from "../../../../api/dialogs/dialogsManager"
import VDOM from "../../../framework/vdom"
import {UICreateDialog} from "./dialog"
import PeersManager from "../../../../api/peers/peersManager"
import {createLogger} from "../../../../common/logger";

const Logger = createLogger("Sidebar")
const $sidebar = VDOM.render(
    <div className="chatlist">
        <div className="toolbar">
            <div className="btn-icon rp rps tgico-menu"/>
            <div className="search">
                <div className="input-search">
                    <input type="text" placeholder="Search"/>
                    <span className="tgico tgico-search"/>
                </div>
            </div>
        </div>

        <div className="connecting" id="connecting_message">
            <progress className="progress-circular"/>
            <span>Waiting for network...</span>
        </div>

        <div id="dialogsWrapper" onScroll={onScrollDialogs}>
            <div id="dialogsPinned" className="list pinned"/>
            <div id="dialogs" className="list"/>
        </div>
    </div>
)

const __rendered_pinned = new Set()
const __rendered = new Set()

const $dialogsWrapper = $sidebar.querySelector("#dialogsWrapper")
const $dialogsPinned = $sidebar.querySelector("#dialogsPinned")
const $dialogs = $sidebar.querySelector("#dialogs")

function handleDialogUpdates(event) {
    if (event.type === "updateMany") {
        event.pinnedDialogs.forEach(dialog => {
            renderDialog(dialog, true)
        })

        event.dialogs.forEach(dialog => {
            renderDialog(dialog, false)
        })

    } else if (event.type === "updateSingle") {
        renderDialog(event.dialog, event.dialog.pinned)
    } else {
        Logger.log("DialogUpdates", event)
    }
}

function handlePeerUpdates(event) {
    if (event.type === "updatePhoto") {
        const dialog = DialogsManager.find(event.peer.type, event.peer.id)
        if (dialog) {
            renderDialog(dialog, event.peer.pinned)
        }
    } else {
        Logger.log("PeerUpdates", event)
    }
}

function renderDialog(dialog, pinned = false) {
    const __ = `${dialog.type}.${dialog.id}`

    if (pinned) {
        if (__rendered_pinned.has(__)) {
            const $dialog = $dialogsPinned.querySelector(`[data-peer="${__}"]`)

            if ($dialog) {
                if (Number($dialog.dataset.messageId) < dialog.lastMessage.id) {
                    $dialogsPinned.prepend($dialog)
                }

                VDOM.patchReal($dialog, UICreateDialog(dialog))
            } else {
                console.warn("dialog is not on the page")
            }
        } else {
            __rendered_pinned.add(__)
            $dialogsPinned.appendChild(VDOM.render(UICreateDialog(dialog)))
        }
    } else {
        if (__rendered.has(__)) {
            const $dialog = $dialogs.querySelector(`[data-peer="${__}"]`)

            if ($dialog) {
                if (Number($dialog.dataset.messageId) < dialog.lastMessage.id) {
                    $dialogs.prepend($dialog)
                }
                // fix this later!!
                // $dialog.replaceWith(VDOM.render(UICreateDialog(dialog)))
                VDOM.patchReal($dialog, UICreateDialog(dialog))
            } else {
                console.warn("dialog is not on the page")
            }
        } else {
            __rendered.add(__)
            $dialogs.appendChild(VDOM.render(UICreateDialog(dialog)))
        }
    }
}

function onScrollDialogs(event) {
    const $element = event.target
    if ($element.scrollHeight - $element.scrollTop === $element.clientHeight) {
        DialogsManager.fetchNextPage({})
    }
}

export function UICreateDialogsSidebar() {
    DialogsManager.listenUpdates(handleDialogUpdates)
    PeersManager.listenUpdates(handlePeerUpdates)

    return $sidebar
}
