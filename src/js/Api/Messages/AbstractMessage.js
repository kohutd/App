import {Dialog} from "../Dialogs/Dialog"
import {Message, MessageType} from "./Message"
import {ReactiveObject} from "../../V/Reactive/ReactiveObject"
import {MessageParser} from "./MessageParser"
import {Peer} from "../Peers/Objects/Peer"
import MessagesManager from "./MessagesManager"
import PeersStore from "../Store/PeersStore"
import MTProto from "../../MTProto/External"
import API from "../Telegram/API"

export const DATE_FORMAT_TIME = {
    hour: '2-digit',
    minute: '2-digit',
    //hour12: false //support USA
}

export const DATE_FORMAT = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
}

export class AbstractMessage extends ReactiveObject implements Message {

    type = MessageType.UNSUPPORTED;

    _dialog: Dialog;

    _to: Peer;
    _from: Peer;
    prefix: string;
    replyToMessage: Message;
    replyToMessageType: string;
    forwarded: any;
    forwardedType: string;
    forwardedMessageId: number;

    _hideAvatar: boolean;
    _tailsGroup: string;

    constructor(dialogPeer: Peer) {
        super()

        if (dialogPeer) {
            this._to = dialogPeer
            this._dialog = dialogPeer.dialog
        }
    }

    init() {
    }

    get dialogPeer() {
        return this.to; // todo: fix this
    }

    get dialog() {
        if (!this._dialog) {
            this._dialog = MessagesManager.getToPeerMessage(this.raw).dialog
        }

        return this._dialog
    }

    set dialog(dialog) {
        this._dialog = dialog
    }

    get id(): number {
        return this.raw.id
    }

    get group() {
        return this._group
    }

    set group(value) {
        this._group = value
    }

    get groupInitializer() {
        return this._groupInitializer
    }

    set groupInitializer(value) {
        this._groupInitializer = value
    }

    get isOut(): boolean {
        if (this.raw.out) {
            return true
        }

        return this.raw.from_id === PeersStore.self().id || this.raw.user_id === PeersStore.self().id
    }

    get isDisplayedInMediaViewer(): boolean {
        return false
    }

    get isSending(): boolean {
        return !!this.raw.sending
    }

    get replyMarkup(): any {
        return this.raw.reply_markup
    }

    get isPost(): boolean {
        return this.raw.post || false
    }

    get isPinned(): boolean {
        return this.to.pinnedMessageId === this.id
    }

    set isPinned(value) {
        this.to.pinnedMessageId = value ? this.id : 0
    }

    get isRead(): boolean {
        if (!this.to) {
            return false
        }

        return this.to.messages.readOutboxMaxId >= this.id || (this.isOut && this.isPost)
    }

    get isInRead(): boolean {
        if (!this.to) {
            return false
        }

        return this.isOut || this.to.messages.readInboxMaxId >= this.id
    }

    get hideAvatar(): boolean {
        return this._hideAvatar;
    }

    set hideAvatar(value: boolean) {
        this._hideAvatar = value;
    }

    get tailsGroup(): string {
        return this._tailsGroup;
    }

    set tailsGroup(value: string) {
        this._tailsGroup = value;
    }

    get text(): string {
        return this.raw.message || ""
    }

    get to(): Peer {
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
            console.warn("no from peer", this)
        } else if (this._from.isMin && !this._from._min_messageId) {
            this._from.minData = {
                message: this,
                dialog: this.to
            }
            this._from._min_messageId = this.id
            this._from._min_inputPeer = this.to.inputPeer
        }

        return this._from
    }

    get date() {
        return this.raw.date
    }

    get editDate() {
        return this.raw.edit_date
    }

    getDate(locale: any, format: any) {
        return new Date(this.date * 1000).toLocaleString(locale, format)
    }

    getFormattedDate() {
        return this.getDate(navigator.language, MTProto.TimeManager.now(true) - this.date > 86400 ? DATE_FORMAT : DATE_FORMAT_TIME)
    }

    // always call super
    show() {
        this.findReplyTo()
        this.findForwarded()
    }

    get smallPreviewImage() {
        return null
    }

    get groupedId() {
        return this.raw.grouped_id
    }

    findReplyTo(fire = true) {
        if (!this.to) {
            return false
        }

        if (this.replyToMessage && this.replyToMessageType && fire) {
            this.fire(this.replyToMessageType)
        }

        if (this.raw.reply_to_msg_id) {
            const replyToMessage = this.to.messages.getById(this.raw.reply_to_msg_id)

            if (replyToMessage) {
                this.replyToMessage = replyToMessage
                this.replyToMessageType = "replyToMessageFound"

                if (fire) {
                    this.fire("replyToMessageFound")
                }
            } else {
                API.messages.getHistory(this.to, {
                    offset_id: this.raw.reply_to_msg_id, // ???
                    add_offset: -1,
                    limit: 1
                }).then(Messages => {
                    const messages = Messages.messages

                    if (messages.length && messages[0].id === this.raw.reply_to_msg_id) {
                        const replyMessage = this.to.messages.putRawMessage(messages[0])
                        this.replyToMessage = replyMessage
                        this.replyToMessageType = "replyToMessageFound"

                        if (fire) {
                            this.fire("replyToMessageFound")
                        }
                    } else {
                        this.replyToMessageType = "replyToMessageNotFound"

                        if (fire) {
                            this.fire("replyToMessageNotFound")
                        }
                    }
                })
            }
        }
    }

    findForwarded(fire = true) {
        if (this.forwarded && this.forwardedType && fire) {
            this.fire(this.forwardedType)

            return
        }

        if (this.raw.fwd_from) {
            if (!this.raw.fwd_from.from_id) {
                if (this.raw.fwd_from.from_name) {
                    this.forwarded = this.raw.fwd_from.from_name
                    this.forwardedType = "forwardedNameOnlyFound"

                    if (fire) {
                        this.fire("forwardedNameOnlyFound")
                    }
                }
            } else {
                const forwarded = PeersStore.get("user", this.raw.fwd_from.from_id)

                if (forwarded) {
                    this.forwarded = forwarded
                    this.forwardedType = "forwardedUserFound"

                    if (fire) {
                        this.fire("forwardedUserFound")
                    }
                }
            }

            if (this.raw.fwd_from.channel_id) {
                const forwarded = PeersStore.get("channel", this.raw.fwd_from.channel_id)

                if (forwarded) {
                    this.forwarded = forwarded
                    this.forwardedMessageId = this.raw.fwd_from.channel_post
                    this.forwardedType = "forwardedChannelFound"

                    if (fire) {
                        this.fire("forwardedChannelFound")
                    }
                }
            }
        }
    }

    read() {
        return this.to.api.readHistory(this.id)
    }

    // WARNING: always call super
    fillRaw(raw: Object): Message {
        this.raw = raw
        this.prefix = MessageParser.getDialogPrefix(this)

        // reply
        if (this.to) {
            const replyToMessage = this.to.messages.getById(this.raw.reply_to_msg_id)
            if (replyToMessage) {
                this.replyToMessage = replyToMessage
            }

            // forwarded
            this.findForwarded()
        }

        // ...

        return this
    }

    fillRawAndFire(raw: Object): Message {
        this.fillRaw(raw)

        this.fire("rawFilled")

        return this
    }
}