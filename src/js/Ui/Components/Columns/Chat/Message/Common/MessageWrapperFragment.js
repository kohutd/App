import {ChatInputManager} from "../../ChatInput/ChatInputComponent";
import {InlineKeyboardComponent} from "./InlineKeyboardComponent";
import {MessageAvatarComponent} from "./MessageAvatarComponent";
import {ReplyFragment} from "./ReplyFragment";
import {ForwardedHeaderFragment} from "./ForwardedHeaderFragment";
import {MessageParser} from "../../../../../../Api/Messages/MessageParser";
import {UserPeer} from "../../../../../../Api/Peers/Objects/UserPeer";
import UIEvents from "../../../../../EventBus/UIEvents";
import AppSelectedInfoPeer from "../../../../../Reactive/SelectedInfoPeer";
import VUI from "../../../../../VUI";
import {ChannelPeer} from "../../../../../../Api/Peers/Objects/ChannelPeer";
import API from "../../../../../../Api/Telegram/API";
import PeerName from "../../../../Reactive/PeerName";
import AppSelectedChat from "../../../../../Reactive/SelectedChat";
import {copyTextToClipboard} from "../../../../../../Utils/clipboard";
import Locale from "../../../../../../Api/Localization/Locale"

function ReplyToMessageFragment({message}) {
    if (!message.raw.reply_to_msg_id) {
        return null;
    } else if (!message.replyToMessage) {
        if (message.replyToMessageType === "replyNotFound") {
            return <ReplyFragment show={true} name="Deleted message" text="Deleted message"/>;
        }

        return (
            <ReplyFragment show={true}/>
        );
    }

    return (
        <ReplyFragment name={message.replyToMessage.from.name}
                       text={MessageParser.getPrefixNoSender(message.replyToMessage)}
                       show={true}
                       onClick={() => {
                           AppSelectedChat.showMessage(message.replyToMessage);
                           // UIEvents.General.fire("chat.showMessage", {message: message.replyToMessage})
                       }}
        />
    );
}

function createContextMenu(message) {
    return [
        {
            icon: "reply",
            title: Locale.l("lng_context_reply_msg"),
            onClick: _ => ChatInputManager.replyTo(message)
        },
        {
            icon: "copy",
            title: Locale.l("lng_context_copy_text"),
            onClick: _ => {
                copyTextToClipboard(message.text);
            }
        },
        {
            icon: _ => message.isPinned ? "unpin" : "pin",
            title: _ => message.isPinned ? Locale.l("lng_context_unpin_msg") : Locale.l("lng_context_pin_msg"),
            onClick: _ => {
                API.messages.updatePinnedMessage(message);
            }
        },
        {
            icon: "forward",
            title: Locale.l("lng_context_forward_msg"),
            onClick: () => {
                UIEvents.General.fire("message.forward", {message, from: message.dialog.peer});
            }
        },
        {
            icon: "delete",
            title: Locale.l("lng_context_delete_msg"),
            red: true,
            onClick: () => {
                if (message.dialogPeer instanceof ChannelPeer) {
                    API.channels.deleteMessages(message.dialogPeer, [message.id]);
                } else {
                    API.messages.deleteMessages([message.id]);
                }
            }
        },
    ];
}

function MessageWrapperFragment(
    {
        message,
        transparent = false,
        outerPad = true,
        contextActions,
        showUsername = true,
        showDate = false,
        isNewMessages = false,
    },
    slot
) {
    if (message.isDeleted) {
        return <div/>; // we don't delete entire element because we need virtualization to continue to work..
    }

    const contextMenuHandler = VUI.ContextMenu.listener(contextActions ? contextActions : createContextMenu(message));

    const doubleClickHandler = _ => ChatInputManager.replyTo(message);

    const topLevelClasses = {
        "message": true,
        "channel": message.isPost,
        "out": !message.isPost && message.isOut,
        "in": message.isPost || !message.isOut,
    };

    const inlineKeyboard = message.replyMarkup && message.replyMarkup._ === "replyInlineMarkup" ?
        <InlineKeyboardComponent message={message}/> : "";

    let contentClasses = {
        "message-content": true,
        "transparent": transparent,
        "read": !message.isSending && message.isRead,
        "sending": message.isSending,
        "no-pad": !outerPad,
        "sent": !message.isSending && !message.isRead, //TODO more convenient method to do this
        "has-inline-keyboard": !!inlineKeyboard
    };
    contentClasses["group-" + message.tailsGroup] = true;

    if (message.raw.fwd_from && (message.raw.fwd_from.saved_from_peer || message.raw.fwd_from.saved_from_msg_id)) {
        topLevelClasses["out"] = false;
        topLevelClasses["in"] = true;
    }

    const isPrivateMessages = message.to instanceof UserPeer;
    const username = showUsername && !transparent && message.from.name && !message.isPost &&
        !message.isOut && !message.raw.reply_to_msg_id && !message.raw.fwd_from && !isPrivateMessages &&
        (message.tailsGroup === "s" || message.tailsGroup === "se");

    const messageNode = (
        <div className={topLevelClasses}
             id={`message-${message.id}`}
             onDblClick={doubleClickHandler}>

            <MessageAvatarComponent message={message} show={!message.hideAvatar}/>

            <div className={contentClasses} onContextMenu={contextMenuHandler}>
                {!transparent && ReplyToMessageFragment({message})}
                <ForwardedHeaderFragment message={message}/>
                {username ? <PeerName peer={message.from} chat={message.to} template={(peer) => {
                    return <div class="peer-name">
                        <div css-cursor="pointer" className="username"
                             onClick={() => AppSelectedInfoPeer.select(peer)}>{peer.name}</div>
                        <div class="rank">{message.to.getPeerRank(message.from)}</div>
                    </div>;
                }}/> : ""}
                {slot}
            </div>
            {inlineKeyboard}
            <div class="side">
                {transparent && ReplyToMessageFragment({message})}
                <div class="filler"/>
                {message.isPost && <div class="share" onClick={() => {
                    UIEvents.General.fire("message.forward", {message, from: message.dialog.peer});
                }}><i class="tgico tgico-forward"/></div>}
            </div>
        </div>
    );

    if (showDate || isNewMessages) {
        return (
            <div className="message-with-date">
                <div className="service date-service">
                    {showDate && <div className="service-msg">
                        {
                            message.getDate("en", {
                                month: 'long',
                                day: 'numeric',
                            })
                        }
                    </div>}
                    {isNewMessages && <div className="service-msg">New messages</div>}
                </div>
                {messageNode}
            </div>
        );
    } else {
        return messageNode;
    }
}

export default MessageWrapperFragment;