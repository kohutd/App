// @flow

import {AbstractMessage} from "../AbstractMessage"
import {MessageType} from "../Message"

class Message {
}

export class VoiceMessage extends AbstractMessage {

    type = MessageType.VOICE

    show() {
        super.show()
    }

    fillRaw(raw: Object): Message {
        return super.fillRaw(raw)
    }
}