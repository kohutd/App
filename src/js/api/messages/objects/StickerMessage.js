// @flow

import {AbstractMessage} from "../AbstractMessage"
import {MessageType} from "../Message"
import type {MessageConstructor} from "../../../mtproto/language/types"
import {FileAPI} from "../../fileAPI"

export class StickerMessage extends AbstractMessage {

    type = MessageType.STICKER

    animated = false
    srcUrl = ""
    w = 0
    h = 0

    show() {
        FileAPI.getFile(this.raw.media.document).then(srcUrl => {
            this.srcUrl = srcUrl
            this.fire("stickerLoaded")
        })
    }

    fillRaw(raw: MessageConstructor) {
        super.fillRaw(raw)

        const size = this.raw.media.document.attributes.find(a => a._ === "documentAttributeImageSize")
        this.w = size ? size.w : null
        this.h = size ? size.h : null
    }
}