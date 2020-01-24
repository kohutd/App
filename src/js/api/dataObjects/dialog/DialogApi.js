import MTProto from "../../../mtproto"

/**
 * @property {Dialog} dialog
 */
export class DialogApi {

    /**
     * @param {Dialog} dialog
     */
    constructor(dialog) {
        this.dialog = dialog
    }

    setPinned(pinned) {
        return MTProto.invokeMethod("messages.toggleDialogPin", {
            peer: {
                _: "inputDialogPeer"
            },
            pinned
        }).then(l => {
            this.dialog.pinned = l
        })
    }

    markDialogUnread(unread) {
        MTProto.invokeMethod("messages.markDialogUnread", {
            flags: 0,
            pFlags: {
                unread: unread
            },
            unread: unread,
            peer: this.dialog.peer.inputPeer
        }).then(response => {
            console.log(response)
        })
    }
}