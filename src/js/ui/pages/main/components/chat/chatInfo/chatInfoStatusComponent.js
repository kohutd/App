import {UserPeer} from "../../../../../../api/dataObjects/peer/userPeer"
import {ChannelPeer} from "../../../../../../api/dataObjects/peer/channelPeer"
import {SupergroupPeer} from "../../../../../../api/dataObjects/peer/supergroupPeer"
import {GroupPeer} from "../../../../../../api/dataObjects/peer/groupPeer"
import {BotPeer} from "../../../../../../api/dataObjects/peer/botPeer"
import AppSelectedDialog from "../../../../../../api/dialogs/selectedDialog"
import AppEvents from "../../../../../../api/eventBus/appEvents"
import Component from "../../../../../framework/vrdom/component"

class ChatInfoStatusComponent extends Component {
    constructor(props) {
        super(props)

        this.state = {
            patchEvents: new Set([
                "updateUserStatus",
                "fullLoaded",
            ]),
        }
    }

    get statusLine() {
        if (AppSelectedDialog.isNotSelected) {
            return "..."
        }

        const peer = AppSelectedDialog.Dialog.peer

        let status = ""

        if (peer instanceof UserPeer) {
            if (peer.onlineStatus.status === "bot") {
                status = peer.onlineStatus.status
            } else {
                status = peer.onlineStatus.online ? "online" : "last seen " + peer.onlineStatus.status
            }
        } else if (peer instanceof ChannelPeer) {
            if (peer.full) {
                const user = peer.full.participants_count === 1 ? "member" : "members"
                status = `${peer.full.participants_count} ${user}`
            } else {
                status = "loading info..."
            }
        } else if (peer instanceof SupergroupPeer) {
            if (peer.full) {
                const user = peer.full.participants_count === 1 ? "member" : "members"
                status = `${peer.full.participants_count} ${user}, ${peer.full.online_count} online`
            } else {
                status = "loading info..."
            }
        } else if (peer instanceof GroupPeer) {
            if (peer.full) {
                const user = peer.raw.participants_count === 1 ? "member" : "members"
                status = `${peer.raw.participants_count} ${user}, ${peer.full.online_count} online`
            } else {
                status = "loading info..."
            }
        } else if (peer instanceof BotPeer) {
            status = "bot"
        }

        return status
    }

    h() {
        return (
            <div className="bottom">
                <div css-display={AppSelectedDialog.isSelected && AppSelectedDialog.Dialog.peer.isSelf ? "none" : ""}
                     id="messages-online" className="info">{this.statusLine}</div>
            </div>
        )
    }

    mounted() {
        AppEvents.Peers.subscribeAny(event => {
            if (AppSelectedDialog.check(event.peer.dialog)) {
                if (this.state.patchEvents.has(event.type)) {
                    this.__patch()
                }
            }
        })
    }
}

export default ChatInfoStatusComponent