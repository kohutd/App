import TextMessageComponent from "../components/chat/message/textMessageComponent";
import ServiceMessageComponent from "../components/chat/message/serviceMessageComponent";
import AudioMessageComponent from "../components/chat/message/audioMessageComponent";
import VoiceMessageComponent from "../components/chat/message/voiceMessageComponent";
import VideoMessageComponent from "../components/chat/message/videoMessageComponent";
import RoundVideoMessageComponent from "../components/chat/message/roundVideoMessageComponent";
import WebpageMessageComponent from "../components/chat/message/webpageMessageComponent";
import StickerMessageComponent from "../components/chat/message/stickerMessageComponent";
import PhotoMessageComponent from "../components/chat/message/photoMessageComponent";
import ContactMessageComponent from "../components/chat/message/contactMessageComponent";
import DocumentMessageComponent from "../components/chat/message/documentMessageComponent";
import PhoneCallMessageComponent from "../components/chat/message/phoneCallMessageComponent";
import {MessageType} from "../../../../api/dataObjects/messages/message"

/**
 * @type {Map<number, function({message: *}): *>}
 */
const handlers = new Map([
    [MessageType.TEXT, TextMessageComponent],
    [MessageType.PHOTO, PhotoMessageComponent],
    [MessageType.ROUND, RoundVideoMessageComponent],
    [MessageType.VIDEO, VideoMessageComponent],
    [MessageType.AUDIO, AudioMessageComponent],
    [MessageType.VOICE, VoiceMessageComponent],
    [MessageType.STICKER, StickerMessageComponent],
    [MessageType.DOCUMENT, DocumentMessageComponent],
    [MessageType.PHONE_CALL, PhoneCallMessageComponent],
    [MessageType.CONTACT, ContactMessageComponent],
    [MessageType.WEB_PAGE, WebpageMessageComponent],
    [MessageType.SERVICE, ServiceMessageComponent],
])

/**
 * @param message
 * @return {*}
 * @constructor
 */
const MessageComponent = ({message}) => {
    const Handler = handlers.get(message.type)

    if (Handler) {
        return <Handler message={message}/>
    } else {
        message.raw.message = "Unsupported message type!"

        return (
            <TextMessageComponent message={message}/>
        )
    }
}

function isBigMedia(message) {
    if (!message.media) return false;
    let media = message.media;
    if (media.photo) return true;
    return false;
}


export default MessageComponent