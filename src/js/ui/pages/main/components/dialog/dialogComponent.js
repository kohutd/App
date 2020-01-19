import {UserPeer} from "../../../../../api/dataObjects/peer/userPeer"
import {DialogTextComponent} from "./dialogTextComponent"
import {AppFramework} from "../../../../framework/framework"
import {DialogAvatarComponent} from "./dialogAvatarComponent"
import AppSelectedDialog from "../../../../../api/dialogs/selectedDialog"
import Component from "../../../../framework/vrdom/component"
import AppEvents from "../../../../../api/eventBus/appEvents"

const DATE_FORMAT = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
}

/**
 * @param {Dialog} dialog
 */
function handleClick(dialog) {
    const p = dialog.peer.username ? `@${dialog.peer.username}` : `${dialog.type}.${dialog.id}`

    return () => AppFramework.Router.push("/", {
        queryParams: {
            p
        }
    })
}

export class DialogComponent extends Component {
    constructor() {
        super();

        this.reactive = {
            selectedDialog: AppSelectedDialog.Reactive.FireOnly
        }
    }

    h() {
        const dialog = this.props.dialog
        const peer = dialog.peer
        const unread = dialog.messages.unreadMentionsCount > 0 ? "@" : (dialog.messages.unreadCount > 0 ? dialog.messages.unreadCount.toString() : (dialog.unreadMark ? " " : ""))

        const personClasses = {
            "person": true,
            "rp": true,
            "online": peer instanceof UserPeer && peer.onlineStatus.online,
            "active": AppSelectedDialog.check(dialog),
            "unread": unread !== "",
            "muted": dialog.isMuted,
        }

        if (dialog.messages.last.isOut) {
            personClasses["sent"] = true

            if (dialog.messages.last.isRead) {
                personClasses["read"] = true
            }
        }

        return (
            <div data-peer-username={dialog.peer.username} data-peer={`${dialog.type}.${dialog.id}`}
                 data-message-id={dialog.messages.last.id}
                 data-date={dialog.messages.last.date}
                 data-pinned={dialog.isPinned === undefined ? false : dialog.isPinned}
                 className={personClasses}
                 onClick={handleClick(dialog)}
                 data-index={dialog.index}>

                <DialogAvatarComponent dialog={dialog}/>

                <div className="content">
                    <div className="top">
                        <div className="title">{peer.name}</div>
                        <div className="status tgico"/>
                        <div className="time">{dialog.messages.last.getDate("en", DATE_FORMAT)}</div>
                    </div>

                    <div className="bottom">
                        <DialogTextComponent dialog={dialog}/>

                        <div css-display={dialog.messages.unreadMentionsCount === 0 ? "none" : ""}
                             className="badge tgico">@
                        </div>
                        <div
                            css-display={dialog.messages.unreadCount === 0 || dialog.messages.unreadMentionsCount > 0 ? "none" : ""}
                            className="badge tgico">{dialog.messages.unreadCount}</div>
                        <div css-display={!dialog.unreadMark ? "none" : ""} className="badge tgico">?</div>
                    </div>
                </div>
            </div>
        )
    }

    mounted() {
        AppEvents.Dialogs.subscribeAnySingle(this.props.dialog, this._handleDialogUpdates)
        AppEvents.Peers.subscribeAnySingle(this.props.dialog.peer, this._handlePeerUpdates)
    }

    changed(key, value) {
        if (key === "selectedDialog") {

            if (value) {
                this.$el.classList.add("responsive-selected-chatlist")
            } else {
                this.$el.classList.remove("responsive-selected-chatlist")
            }

            if (value === this.props.dialog || AppSelectedDialog.PreviousDialog === this.props.dialog) {
                this.__patch()
            }

        }
    }

    _patchAndResort() {
        if (String(this.props.dialog.isPinned) !== this.$el.dataset.pinned) {

            if (this.props.dialog.isPinned) {
                this.props.$pinned.prepend(this.$el)
            } else {
                const $foundRendered = this._findRenderedDialogToInsertBefore()

                if ($foundRendered) {
                    this.props.$general.insertBefore(this.$el, $foundRendered)
                }
            }

        } else if (!this.props.dialog.messages.last) {
            // todo: handle no last message
        } else if (parseInt(this.$el.dataset.date) !== this.props.dialog.messages.last.date) {
            if (!this.props.dialog.isPinned) {
                this.props.$general.prepend(this.$el)
            }
        }

        this.__patch()
    }

    /**
     * Handles Dialog updates
     * @param event
     * @private
     */
    _handleDialogUpdates(event) {
        switch (event.type) {
            case "newMessage":
                this._patchAndResort()

                break

            case "updateSingle":
                this._patchAndResort()

                break

            case "updateDraftMessage":
                this.__patch()

                break

            case "updateReadHistoryInbox":
                this.__patch()

                break

            case "readHistory":
                this.__patch()

                break

            case "updateReadHistoryOutbox":
                this.__patch()

                break

            case "updateReadChannelInbox":
                this.__patch()

                break

            case "updateReadChannelOutbox":
                this.__patch()

                break

            case "updatePinned":
                this._patchAndResort()

                break
        }
    }


    /**
     * Handles Peer updates
     * @param event
     * @private
     */
    _handlePeerUpdates(event) {
        if (event.type === "updatePhoto" || event.type === "updatePhotoSmall") {
            this.__patch()
        } else if (event.type === "updateUserStatus") {
            this.__patch()
        }
    }

    /**
     * @return {ChildNode|Element|Node|undefined}
     * @private
     */
    _findRenderedDialogToInsertBefore() {
        const dialog = this.props.dialog
        const renderedDialogs = this.props.$general.childNodes

        if (renderedDialogs.size === 0) {
            return undefined
        }

        let minDiff = 999999999999

        /**
         * @type {undefined|Element|Node}
         */
        let $dialog = undefined

        const lastMessageDate = parseInt(dialog.messages.last.date)

        // there is a better way to do this.
        // looks like $general.childNodes already sorted, so we do not need to check each node
        // i will implement it later

        renderedDialogs.forEach($rendered => {
            if ($rendered !== this.$el) {
                const datasetDate = parseInt($rendered.dataset.date)
                const nextDiff = Math.abs(lastMessageDate - datasetDate)

                if (minDiff > nextDiff) {
                    minDiff = nextDiff
                    $dialog = $rendered
                }
            }
        })

        if (parseInt($dialog.dataset.date) > lastMessageDate && $dialog.nextSibling) {
            return $dialog.nextSibling
        }

        return $dialog  // fuuuuuuck
    }
}
