import {getInputFromPeer, getInputPeerFromPeer} from "../../dialogs/util";
import MTProto from "../../../mtproto/external"
import AppEvents from "../../eventBus/AppEvents"
import {PeerPhoto} from "./PeerPhoto"
import {Dialog} from "../../dialogs/Dialog"
import {PeerApi} from "../PeerApi"
import {ReactiveObject} from "../../../ui/v/reactive/ReactiveObject"
import {PeerMessages} from "../PeerMessages"
import DialogsStore from "../../store/DialogsStore"
import PeersManager from "./PeersManager"
import type {Message} from "../../messages/Message";

export class Peer extends ReactiveObject {

    eventBus = AppEvents.Peers
    eventObjectName = "peer"

    _rawPeer
    _filled = false
    _dialog
    _photo
    _accessHash
    _min_messageId
    _min_inputPeer
    full
    _api
    _pinnedMessage: Message

    _messages: PeerMessages

    constructor(rawPeer, dialog = undefined) {
        super()

        this._rawPeer = rawPeer
        this._dialog = dialog

        this._photo = PeerPhoto.createEmpty(this)
        this._api = new PeerApi(this)
        this._messages = new PeerMessages(this)

        this.fillRaw(rawPeer)
    }

    /**
     * @return {PeerMessages}
     */
    get messages() {
        return this._messages
    }

    /**
     * @return {PeerApi}
     */
    get api() {
        return this._api
    }

    /**
     * @protected
     * @return {*}
     */
    get raw() {
        return this._rawPeer
    }

    /**
     * @private
     * @param rawPeer
     */
    set raw(rawPeer) {
        this._rawPeer = rawPeer
    }

    /**
     * @return {number}
     */
    get id() {
        return this.raw.id
    }

    /**
     * @return {Dialog|undefined}
     */
    get dialog() {
        if (!this._dialog) {
            this._dialog = DialogsStore.get(this.type, this.id)

            if (this._dialog) {
                this._dialog.peer = this
            }
        }

        return this._dialog
    }

    /**
     * @param {Dialog} dialog
     */
    set dialog(dialog) {
        this._dialog = dialog
    }

    get accessHash() {
        return this._accessHash
    }

    get isDeleted() {
        return this.raw.pFlags && this.raw.pFlags.deleted
    }

    get username() {
        return this.raw.username
    }

    get statusString() {
        return {
            text: "...",
            online: false
        }
    }

    get isVerified() {
        return this.raw.pFlags && this.raw.pFlags.verified === true
    }

    get firstName() {
        return this.raw.first_name
    }

    get lastName() {
        return this.raw.last_name
    }

    get name() {
        return this.firstName + (this.lastName ? " " + this.lastName : "")
    }

    get isMin() {
        return this.raw.pFlags && this.raw.pFlags.min === true
    }

    get isSelf() {
        return this.raw.pFlags && this.raw.pFlags.self === true
    }

    get inputPeer() {
        return this.isMin ? this.inputPeerFromMessage : getInputPeerFromPeer(this.type, this.id, this.accessHash)
    }

    get input() {
        return this.isMin ? this.inputFromMessage : getInputFromPeer(this.type, this.id, this.accessHash)
    }

    get inputPeerFromMessage() {
        if (this.type === "user") {
            return {
                _: "inputPeerUserFromMessage",
                peer: this._min_inputPeer,
                msg_id: this._min_messageId,
                user_id: this.id
            }
        } else if (this.type === "channel") {
            return {
                _: "inputPeerChannelFromMessage",
                peer: this._min_inputPeer,
                msg_id: this._min_messageId,
                channel_id: this.id
            }
        } else {
            console.warn("Potential BUG: cannot get inputPeerFromMessage, returning channel")

            return {
                _: "inputPeerChannelFromMessage",
                peer: this._min_inputPeer,
                msg_id: this._min_messageId,
                channel_id: this.id
            }
        }
    }

    get inputFromMessage() {
        if (this.type === "user") {
            return {
                _: "inputUserFromMessage",
                peer: this._min_inputPeer,
                msg_id: this._min_messageId,
                user_id: this.id
            }
        } else if (this.type === "channel") {
            return {
                _: "inputFromMessage",
                peer: this._min_inputPeer,
                msg_id: this._min_messageId,
                channel_id: this.id
            }
        } else {
            console.warn("Potential BUG: cannot get inputPeerFromMessage, returning channel")

            return {
                _: "inputChannelFromMessage",
                peer: this._min_inputPeer,
                msg_id: this._min_messageId,
                channel_id: this.id
            }
        }
    }

    get pinnedMessageId() {
        return this._pinnedMessageId || (this.full && this.full.pinned_msg_id)
    }

    set pinnedMessageId(value) {
        this._pinnedMessage = null
        this._pinnedMessageId = value
        this.findPinnedMessage()
    }

    /**
     * @return {PeerPhoto}
     */
    get photo() {
        return this._photo
    }

    /**
     * Sets the new photo
     * @param photo
     */
    set photo(photo) {
        this._photo = photo
    }

    /**
     * Get the type of peer
     * @returns {string}
     */
    get type() {
        return this.raw._
    }

    /**
     * @return {Promise<*>}
     */
    fetchFull() {
        return MTProto.invokeMethod("users.getFullUser", {
            id: this.input
        }).then(userFull => {
            this.full = userFull

            this.fire("fullLoaded")
            this.findPinnedMessage()
        })
    }

    findPinnedMessage(fire = true) {
        if(this.pinnedMessageId) {
            if(this._pinnedMessage && fire) {
                this.fire("pinnedMessageFound", {
                    message: this._pinnedMessage
                })
                return
            }

            const message = this.messages.get(this.pinnedMessageId)

            if (message) {
                this._pinnedMessage = message

                if (fire) {
                    this.fire("pinnedMessageFound", {
                        message: this._pinnedMessage
                    })
                }
            } else {
                this.api.getHistory({
                    offset_id: this.pinnedMessageId, // ???
                    add_offset: -1,
                    limit: 1
                }).then(messages => {
                    if (messages.length && messages[0].id === this.pinnedMessageId) {
                        this.messages.appendOtherSingle(messages[0])
                        this._pinnedMessage = messages[0]

                        if (fire) {
                            this.fire("pinnedMessageFound", {
                                message: this._pinnedMessage
                            })
                        }
                    } else {
                        console.log("no pinned!")
                    }
                })
            }
        } else {
            this.fire("pinnedMessageFound", {
                message: null
            })
        }
    }

    /**
     * CRITICAL TODO: handle min if filled non-min!!!!!!!!!!!!!!!!!!
     * @param rawPeer
     */
    fillRaw(rawPeer) {
        if (rawPeer._ !== this.type || rawPeer.id !== this.id) {
            console.error("BUG: what the hell??")
        }

        // When receiving said (min) constructors, the client must first check if user or chat object without min flag is already present in local cache. If it is present, then the client should just ignore constructors with min flag and use local one instead.
        if (rawPeer.pFlags && rawPeer.pFlags.min && this._filledNonMin) {
            return this
        }

        this.raw = rawPeer

        // НЕ РУХАЙ
        if (this.accessHash === undefined) {
            this._accessHash = this.raw.access_hash
        } else if (rawPeer.pFlags && !rawPeer.pFlags.min) {
            this._accessHash = this.raw.access_hash
        }

        this._photo.fillRaw(rawPeer.photo)

        if (!this.isMin) {
            this._filledNonMin = true
        }

        return this
    }

    /**
     * @param rawPeer
     */
    fillRawAndFire(rawPeer) {
        this.fillRaw(rawPeer)

        this.fire("updateSingle")

        return this
    }
}