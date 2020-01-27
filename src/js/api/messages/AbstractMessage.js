// @flow

import {Dialog} from "../dataObjects/dialog/Dialog"
import {Message, MessageType} from "./Message"
import {ReactiveObject} from "../../ui/v/reactive/ReactiveObject"
import {MessageParser} from "./MessageParser"
import {Peer} from "../dataObjects/peer/Peer"
import MessagesManager from "./MessagesManager"
import PeersStore from "../store/PeersStore"

export class AbstractMessage extends ReactiveObject implements Message {

    type = MessageType.UNSUPPORTED

    _to: Peer
    _from: Peer
    prefix: string

    constructor(dialog: Dialog) {
        super()

        this.dialog = dialog
    }

    get id(): number {
        return this.raw.id
    }

    get isOut(): boolean {
        if (this.raw.pFlags.out) {
            return true
        }

        return this.raw.from_id === PeersStore.self().id || this.raw.user_id === PeersStore.self().id
    }

    get isPost(): boolean {
        return this.raw.pFlags.post || false
    }

    get isRead(): boolean {
        return this.dialog.messages.readOutboxMaxId >= this.id || this.dialog.messages.readInboxMaxId >= this.id
    }

    get text(): string {
        return this.raw.message || ""
    }

    get to(): Peer {
        if (this.dialog) {
            return this.dialog.peer
        }

        if (this._to) {
            return this._to
        }

        this._to = MessagesManager.getToPeerMessage(this.raw)

        return this._to
    }

    get from(): Peer {
        if (this._from) {
            return this._from
        }

        this._from = MessagesManager.getFromPeerMessage(this.raw)

        if (!this._from) {
            console.warn("no from peer")
        }

        return this._from
    }

    get date() {
        return this.raw.date
    }

    getDate(locale: any, format: any) {
        return new Date(this.date * 1000).toLocaleString(locale, format)
    }

    show() {
        console.warn("unimplemented show method")
    }

    // WARNING: always call super
    fillRaw(raw: Object): Message {
        this.raw = raw
        this.prefix = MessageParser.getDialogPrefix(this)

        return this
    }

    fillRawAndFire(raw: Object): Message {
        this.fillRaw(raw)

        this.fire("rawFilled")

        return this
    }
}