import {MTProto} from "../../mtproto/external"
import {getInputPeerFromPeer, getInputPeerFromPeerWithoutAccessHash, getPeerTypeFromType} from "./util"
import TimeManager from "../../mtproto/timeManager"
import PeersManager from "../peers/objects/PeersManager"
import {Dialog} from "./Dialog";
import {Manager} from "../manager";
import {Peer} from "../peers/objects/Peer";
import {PeerAPI} from "../peerAPI"
import DialogsStore from "../store/DialogsStore"
import AppEvents from "../eventBus/AppEvents"
import PeersStore from "../store/PeersStore"
import AppSelectedPeer from "../../ui/reactive/SelectedPeer"
import {MessageFactory} from "../messages/MessageFactory"
import API from "../telegram/API"

class DialogManager extends Manager {
    constructor() {
        super()

        this.latestDialog = undefined
        this.dialogsOffsetDate = 0 // TODO
        this.offsetDate = 0
        this.count = undefined

        this.isFetched = false
    }


    init() {
        if (this._inited) {
            return Promise.resolve()
        }

        AppSelectedPeer.subscribe(_ => {
            if (AppSelectedPeer.Previous) {
                AppSelectedPeer.Previous.dialog.peer.messages.clear()
            }
        })

        MTProto.UpdatesManager.subscribe("updateDialogPinned", async update => {
            const peerType = getPeerTypeFromType(update.peer.peer._)
            const dialog = await this.findOrFetch(peerType, update.peer.peer[`${peerType}_id`])

            if (!dialog) return

            dialog.pinned = update.pFlags.pinned || false
        })


        MTProto.UpdatesManager.subscribe("updateChannel", async update => {
            await this.findOrFetch("channel", update.channel_id)
        })

        MTProto.UpdatesManager.subscribe("updateReadHistoryInbox", update => {
            const dialog = this.findByPeer(update.peer)

            if (dialog) {
                dialog.peer.messages.readInboxMaxId = update.max_id

                if (update.still_unread_count === 0) {
                    dialog.peer.messages.clearUnread()
                } else {
                    dialog.peer.messages.unreadCount = update.still_unread_count
                    dialog.peer.messages.clearUnreadIds()
                }
            }
        })

        MTProto.UpdatesManager.subscribe("updateReadHistoryOutbox", update => {
            const dialog = this.findByPeer(update.peer)
            if (dialog) {
                dialog.peer.messages.readOutboxMaxId = update.max_id
            }
        })

        MTProto.UpdatesManager.subscribe("updateReadChannelInbox", update => {
            const dialog = this.find("channel", update.channel_id)

            if (dialog) {
                dialog.peer.messages.startTransaction()
                dialog.peer.messages.readInboxMaxId = update.max_id
                if (update.still_unread_count === 0) {
                    dialog.peer.messages.clearUnread()
                } else {
                    dialog.peer.messages.unreadCount = update.still_unread_count
                    dialog.peer.messages.clearUnreadIds()
                }
                dialog.peer.messages.stopTransaction()

                dialog.fire("updateReadChannelInbox")
            }
        })

        MTProto.UpdatesManager.subscribe("updateReadChannelOutbox", update => {
            const dialog = this.find("channel", update.channel_id)
            if (dialog) {
                dialog.peer.messages.readOutboxMaxId = update.max_id

                dialog.fire("updateReadChannelOutbox")
            }
        })

        this._inited = true
    }

    fetchNextPage({limit = 40}) {
        if (DialogsStore.count >= this.count) {
            console.warn("all dialogs were fetched")
            return Promise.reject()
        }

        const latestDialog = this.latestDialog
        const peer = latestDialog.peer

        const offsetPeer = peer.inputPeer

        const data = {
            limit: limit,
            offset_peer: offsetPeer,
            exclude_pinned: true
        }

        return this.getDialogs(data).then(dialogs => {
            AppEvents.Dialogs.fire("nextPage", {
                dialogs: dialogs.filter(dialog => !dialog.isPinned),
                pinnedDialogs: dialogs.filter(dialog => dialog.isPinned)
            })

            return dialogs
        })
    }

    /**
     * @param type
     * @param id
     * @return {Dialog|undefined}
     */
    find(type, id) {
        return DialogsStore.get(type, id)
    }

    /**
     * @param type
     * @param id
     * @return {Promise<Dialog|null>}
     */
    async findOrFetch(type, id) {
        let dialog = DialogsStore.get(type, id)

        if (!dialog) {
            let peer = PeersStore.get(type, id)

            if (peer) {
                dialog = peer.dialog
                DialogsStore.set(dialog)
            } else {
                dialog = await this.getPeerDialogs({_: type, id})
                DialogsStore.set(dialog)
            }
        }

        return dialog
    }

    /**
     * @param peer
     * @return {Dialog}
     */
    findByPeer(peer) {
        if (peer instanceof Peer) return DialogsStore.get(peer.type, peer.id)

        const keys = {
            peerUser: "user",
            peerChannel: "channel",
            peerChat: "chat"
        }

        const key = keys[peer._]
        const keysId = {
            peerUser: "user_id",
            peerChannel: "channel_id",
            peerChat: "chat_id"
        }
        const keyId = keysId[peer._]
        return DialogsStore.get(key, peer[keyId])
    }

    fetchFromMessage(rawMessage, peer = null) {
        const peerData = {
            _: "inputDialogPeer",
            peer: {
                _: "inputPeerUserFromMessage",
                peer: {
                    _: "inputPeerEmpty"
                },
                msg_id: rawMessage.id,
                user_id: rawMessage.user_id
            }
        }

        return MTProto.invokeMethod("messages.getPeerDialogs", {
            peers: [peerData]
        }).then(_dialogsSlice => {
            _dialogsSlice.users.forEach(l => {
                PeersManager.setFromRawAndFire(l)
            })
            _dialogsSlice.chats.forEach(l => {
                PeersManager.setFromRawAndFire(l)
            })

            const dialogs = _dialogsSlice.dialogs.map(_dialog => {
                return this.resolveDialogWithSlice(_dialog, _dialogsSlice)
            })

            dialogs[0].fire("updateSingle")
        })
    }

    getPeerDialogs(peer) {
        console.log("fetching new dialog")

        const peerData = {
            _: "inputDialogPeer",
            peer: !peer.access_hash ? getInputPeerFromPeerWithoutAccessHash(peer._, peer.id) : getInputPeerFromPeer(peer._, peer.id, peer.access_hash)
        }

        return MTProto.invokeMethod("messages.getPeerDialogs", {
            peers: [peerData]
        }).then(rawDialogs => {
            console.log("dialog fetched", rawDialogs)

            rawDialogs.users.forEach(l => {
                PeersManager.setFromRawAndFire(l)
            })
            rawDialogs.chats.forEach(l => {
                PeersManager.setFromRawAndFire(l)
            })

            return rawDialogs.dialogs.map(_dialog => {
                return this.resolveDialogWithSlice(_dialog, rawDialogs)
            })[0]
        })
    }

    /**
     * @param {Object} rawDialog
     * @param {Object} rawSlice
     * @param config
     * @return {Dialog|undefined}
     */
    resolveDialogWithSlice(rawDialog, rawSlice, config = {}) {
        const plainPeer = PeerAPI.getPlain(rawDialog.peer, false)

        const rawPeer = (plainPeer._ === "user" ? rawSlice.users : rawSlice.chats).find(l => l.id === plainPeer.id)
        const rawTopMessage = rawSlice.messages.find(l => l.id === rawDialog.top_message)

        const peer = PeersManager.setFromRaw(rawPeer)

        const dialog = this.setFromRaw(rawDialog, peer)
        dialog.peer.messages.last = MessageFactory.fromRaw(dialog, rawTopMessage)
        return dialog
    }

    /**
     * @param params.limit
     * @param params.flags
     * @param params.exclude_pinned
     * @param params.folder_id
     * @param params.offset_date
     * @param params.offset_id
     * @param params.offset_peer
     * @param params.hash
     * @return {Promise<*>}
     */
    getDialogs(params) {

        params.offset_date = params.offset_date || this.offsetDate

        if (DialogsStore.count >= this.count) {
            console.warn("all dialogs were fetched")
        }

        if (this.dialogsOffsetDate) {
            this.offsetDate = this.dialogsOffsetDate + TimeManager.timeOffset
        }

        return API.messages.getDialogs(params).then(rawDialogs => {
            if (rawDialogs.count === 0) {
                this.count = 0
                console.warn("there is no dialogs")
                return
            }

            if (rawDialogs.count) {
                this.count = rawDialogs.count
            }

            if (parseInt(rawDialogs.count) === 0) {
                return
            }

            rawDialogs.users.forEach(rawUser => {
                PeersManager.setFromRaw(rawUser)
            })
            rawDialogs.chats.forEach(rawChat => {
                PeersManager.setFromRaw(rawChat)
            })

            const dialogs = rawDialogs.dialogs.map(rawDialog => {
                const dialog = this.resolveDialogWithSlice(rawDialog, rawDialogs)

                if (dialog.peer.messages.last) {
                    this.offsetDate = dialog.peer.messages.last.date
                } else {
                    console.error("BUG: no last message!")
                }

                if (this.offsetDate && !dialog.isPinned && (!this.dialogsOffsetDate || this.offsetDate < this.dialogsOffsetDate)) {
                    this.dialogsOffsetDate = this.offsetDate
                }

                return dialog
            })

            this.latestDialog = dialogs[dialogs.length - 1]

            return dialogs
        })
    }

    fetchFirstPage() {
        return this.getDialogs({}).then(dialogs => {
            this.isFetched = true

            AppEvents.Dialogs.fire("firstPage", {
                dialogs: dialogs.filter(dialog => !dialog.isPinned),
                pinnedDialogs: dialogs.filter(dialog => dialog.isPinned)
            })

            return dialogs
        })
    }

    setFromRaw(rawDialog, peer, topMessage) {
        const plainPeer = PeerAPI.getPlain(rawDialog.peer, false)

        if (DialogsStore.has(plainPeer._, plainPeer.id)) {
            const dialog = DialogsStore.get(plainPeer._, plainPeer.id)
            dialog.fillRaw(rawDialog)
            return dialog
        } else {
            const dialog = new Dialog(rawDialog, peer, topMessage)
            DialogsStore.set(dialog)
            return dialog
        }
    }

    setFromRawAndFire(rawDialog, peer, topMessage) {
        const plainPeer = PeerAPI.getPlain(rawDialog.peer, false)

        if (DialogsStore.has(plainPeer._, plainPeer.id)) {
            const dialog = DialogsStore.get(plainPeer._, plainPeer.id)
            dialog.fillRawAndFire(rawDialog)
            return dialog
        } else {
            const dialog = new Dialog(rawDialog, peer, topMessage)
            DialogsStore.set(dialog)

            dialog.fire("updateSingle")

            return dialog
        }
    }
}

const DialogsManager = new DialogManager()

export default DialogsManager