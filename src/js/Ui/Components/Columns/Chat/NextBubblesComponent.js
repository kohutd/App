/*
 * Copyright 2020 Telegram V authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import VComponent from "../../../../V/VRDOM/component/VComponent"
import AppSelectedChat from "../../../Reactive/SelectedChat"
import UIEvents from "../../../EventBus/UIEvents"
import AppEvents from "../../../../Api/EventBus/AppEvents"
import MessageComponent from "./MessageComponent"
import {UserPeer} from "../../../../Api/Peers/Objects/UserPeer"
import {ServiceMessage} from "../../../../Api/Messages/Objects/ServiceMessage"
import type {Message} from "../../../../Api/Messages/Message"
import vrdom_delete from "../../../../V/VRDOM/delete"
import vrdom_render from "../../../../V/VRDOM/render/render"
import scrollToAndHighlight from "../../../../Utils/scrollToAndHighlight"
import findIntersection from "../../../Virtual/findIntersection"
import vrdom_deleteInner from "../../../../V/VRDOM/deleteInner"
import VirtualMessages from "../../../Virtual/VirtualMessages"
import scrollBottom from "../../../../Utils/scrollBottom"
import API from "../../../../Api/Telegram/API"
import StatelessComponent from "../../../../V/VRDOM/component/StatelessComponent"
import {vrdom_appendRealMany} from "../../../../V/VRDOM/append"
import {vrdom_prependRealMany} from "../../../../V/VRDOM/prepend"

function getMessageElementById(messageId: number): HTMLElement | null {
    return document.getElementById(`message-${messageId}`); // dunno better way, sorry
}

// there is no possibility nor time to calculate each message size
class NextBubblesComponent extends StatelessComponent {
    bubblesInnerRef = VComponent.createRef();

    isLoadingRecent = false;
    mainVirtual: VirtualMessages = new VirtualMessages();
    secondVirtual: VirtualMessages = new VirtualMessages();

    isUsingSecondVirtual = false;
    actionCount = 0;

    identifier = `bubbles-component`;

    get currentVirtual(): VirtualMessages {
        if (this.isUsingSecondVirtual) {
            return this.secondVirtual;
        }

        return this.mainVirtual;
    }

    appEvents(E) {
        E.bus(AppEvents.Peers)
            .filter(event => AppSelectedChat.check(event.peer))
            .on("messages.recent", this.onPeerMessagesRecent)
            .on("messages.allRecent", this.onPeerMessagesAllRecent)
            .on("messages.nextTopPageDownloaded", this.onTopPageMessagesReady)
            .on("messages.nextBottomPageDownloaded", this.onBottomPageMessagesReady)
            .on("chat.showMessageReady", this.onChatShowMessageReady);

        E.bus(AppEvents.Dialogs)
            .filter(event => AppSelectedChat.check(event.dialog.peer))
            .on("newMessage", this.onNewMessage);

        E.bus(UIEvents.General)
            .on("chat.select", this.onChatSelect)
            .on("chat.topMessagesReady", this.onTopPageMessagesReady)
            .on("chat.showMessage", this.onChatShowMessage)
            .on("chat.scrollBottom", this.onChatScrollBottomRequest);
    }

    render() {
        return (
            <div id="bubbles" className="scrollable">
                <div ref={this.bubblesInnerRef} id="bubbles-inner"/>
            </div>
        );
    }

    componentDidMount() {
        this.props.loaderRef.$el.style.display = "none";

        this.$el.addEventListener("scroll", this.onScroll, {
            passive: true,
        });
    }

    renderMessage = (message: Message, prevMessage: Message = null, nextMessage: Message = null): HTMLElement => {
        return vrdom_render(this.renderVRMessage(message, prevMessage, nextMessage));
    }

    renderVRMessage = (message: Message, prevMessage: Message = null, nextMessage: Message = null): HTMLElement => {
        const isOut = !message.isPost && message.isOut;
        const hideAvatar = isOut || message.isPost || message.to instanceof UserPeer || message instanceof ServiceMessage;

        message.hideAvatar = true;

        let prevCurr = this._isGrouping(prevMessage, message);
        let currNext = this._isGrouping(message, nextMessage);
        if (!prevCurr && currNext) {
            message.tailsGroup = "s";
        } else if (!currNext) {
            if (!prevCurr) {
                message.tailsGroup = "se";
            } else {
                message.tailsGroup = "e";
            }
            if (!isOut) message.hideAvatar = false;
        } else {
            message.tailsGroup = "m";
        }

        return <MessageComponent message={message}/>;
    }

    _isGrouping(one: Message, two: Message) {
        if (!one || !two) return false;
        return (!(one.type instanceof ServiceMessage) && !(two.type instanceof ServiceMessage))
            && (one.isPost || one.isOut === two.isOut)
            && (one.from.id === two.from.id)
            && (Math.abs(one.date - two.date) < 5 * 60);
    }

    cleanupTree = () => {
        vrdom_deleteInner(this.bubblesInnerRef.$el);
    }

    refresh = () => {
        this.cleanupTree();
        this.mainVirtual.refresh();
        this.secondVirtual.refresh();

        this.isLoadingRecent = false;
        this.isUsingSecondVirtual = false;
    }

    // first message must always be last
    fixMessages(messages: Message[]): Message[] {
        if (messages.length > 0 && messages[0].id > messages[messages.length - 1].id) {
            messages = messages.reverse();
        }

        return messages;
    }

    scrollBottom() {
        scrollBottom(this.$el, this.bubblesInnerRef.$el);
    }

    appendMessages(messages: Message[], beforeTopMessage: Message = null, afterBottomMessage: Message = null) {
        // messages = messages.slice().reverse();

        if (messages.length > 0) {
            if (!__IS_PRODUCTION__) {
                if (!beforeTopMessage) {
                    console.log("[warn] append no before message")
                }
                if (!afterBottomMessage) {
                    console.log("[warn] append no after message")
                }
                if (beforeTopMessage && messages[0].id < beforeTopMessage.id) {
                    console.error("append before", beforeTopMessage, messages)
                }
                if (afterBottomMessage && messages[messages.length - 1].id > afterBottomMessage.id) {
                    console.error("append after", afterBottomMessage, messages)
                }
            }

            const $messages = [this.renderMessage(messages[0], beforeTopMessage, messages[1])];

            //[0,1,2,3]
            //[x,0,1]
            //[0,1,2] loop
            //[1,2,3] loop
            //[2,3,y]
            for (let i = 1; i < messages.length - 1; i++) {
                $messages.push(this.renderMessage(messages[i], messages[i - 1], messages[i + 1]));
            }

            if (messages.length > 1) {
                $messages.push(this.renderMessage(messages[messages.length - 1], messages[messages.length - 2], afterBottomMessage));
            }

            vrdom_appendRealMany($messages, this.bubblesInnerRef.$el)

            return $messages;
        }

        return [];
    }

    prependMessages(messages: HTMLElement[], beforeTopMessage: Message = null, afterBottomMessage: Message = null) {
        // messages = messages.slice().reverse();

        if (messages.length > 0) {
            if (!__IS_PRODUCTION__) {
                if (!beforeTopMessage) {
                    console.log("[warn] prepend no before message")
                }
                if (!afterBottomMessage) {
                    console.log("[warn] prepend no after message")
                }
                if (beforeTopMessage && messages[0].id < beforeTopMessage.id) {
                    console.error("prepend shit before", beforeTopMessage, messages)
                }
                if (afterBottomMessage && messages[messages.length - 1].id > afterBottomMessage.id) {
                    console.error("prepend shit after", afterBottomMessage, messages)
                }
            }

            const $messages = [this.renderMessage(messages[0], beforeTopMessage, messages[1])];

            for (let i = 1; i < messages.length - 1; i++) {
                $messages.push(this.renderMessage(messages[i], messages[i - 1], messages[i + 1]));
            }

            if (messages.length > 1) {
                $messages.push(this.renderMessage(messages[messages.length - 1], messages[messages.length - 2], afterBottomMessage));
            }

            vrdom_prependRealMany($messages.reverse(), this.bubblesInnerRef.$el);

            return $messages;
        }

        return [];
    }

    onChatSelect = () => {
        this.refresh();

        if (AppSelectedChat.isSelected) {
            this.isLoadingRecent = true;

            AppSelectedChat.current.messages.fireRecent();
        }
    }

    onChatScrollBottomRequest = () => {
        if (this.isLoadingRecent) {
            return;
        }

        if (this.virtual_isCompletelyBottom()) {
            this.isUsingSecondVirtual = false;
            this.scrollBottom();
        } else {
            this.cleanupTree();
            this.isUsingSecondVirtual = false;
            this.secondVirtual.refresh();
            // patching is good idea, but it doesn't work properly
            // vrdom_patch(this.bubblesInnerRef.$el, <div ref={this.bubblesInnerRef} id="bubbles-inner">{this.mainVirtual.veryBottomPage().map(m => this.renderVRNodeMessage(m))}</div>)
            this.appendMessages(this.mainVirtual.veryBottomPage(), this.mainVirtual.getBeforePageTopOne(), this.mainVirtual.getAfterPageBottomOne());
            this.scrollBottom();
            this.dev_checkTree();
        }
    }

    onScroll = () => {
        const {scrollTop, scrollHeight, clientHeight} = this.$el;
        const isAtBottom = scrollHeight - scrollTop === clientHeight;
        const isAtTop = scrollTop <= 400;
        // const isAtTop = scrollTop === 0;

        if ((scrollHeight - scrollTop) >= (clientHeight - 20)) {
            UIEvents.General.fire("chat.scrollBottom.show");
        }

        if (isAtTop) {
            // console.log("on top")
            this.virtual_onScrolledTop();
        } else if (isAtBottom) {
            if (this.virtual_isCompletelyBottom() || (!this.mainVirtual.hasMoreOnTopToDownload && this.virtual_isCompletelyBottom())) {
                UIEvents.General.fire("chat.scrollBottom.hide");
            }
            this.virtual_onScrolledBottom();
        }
    }

    onPeerMessagesRecent = (event) => {
        this.refresh();

        this.currentVirtual.hasMoreOnTopToDownload = true;

        this.mainVirtual.messages = this.fixMessages(event.messages.slice());

        if (event.messages.length < 60) {
            this.isLoadingRecent = true;
            AppSelectedChat.current.messages.fireAllRecent();
        }

        this.prependMessages(this.mainVirtual.veryBottomPage(), this.mainVirtual.getBeforePageTopOne(), this.mainVirtual.getAfterPageBottomOne());
        this.scrollBottom();
    }

    onPeerMessagesAllRecent = event => {
        this.isLoadingRecent = true;
        event.messages = this.fixMessages(event.messages.slice());
        const lenbeforefuck = this.mainVirtual.currentPage.length;
        this.mainVirtual.messages = [...event.messages, ...this.mainVirtual.messages];
        this.currentVirtual.hasMoreOnTopToDownload = this.mainVirtual.messages.length === 100;
        const vbp = this.mainVirtual.veryBottomPage();
        this.prependMessages(vbp.slice(0, vbp.length - lenbeforefuck), null, this.mainVirtual.messages[0]);
        this.scrollBottom();
        this.isLoadingRecent = false;
    }

    onNewMessage = (event) => {
        const message = event.message;

        if (this.virtual_isCompletelyBottom()) {
            this.mainVirtual.messages.push(message);

            const {scrollTop, scrollHeight, clientHeight} = this.$el;
            const isAtBottom = scrollHeight - scrollTop === clientHeight;

            if (this.mainVirtual.currentPage.length > this.mainVirtual.size) {
                vrdom_delete(this.bubblesInnerRef.$el.firstChild);
                this.dev_checkTree();
            }

            this.mainVirtual.veryBottomPage();

            this.appendMessages([message], this.mainVirtual.getBeforePageTopOne(), this.mainVirtual.getAfterPageBottomOne());

            if (isAtBottom) {
                this.$el.scrollTop = this.bubblesInnerRef.$el.clientHeight;
            } else {
                this.$el.scrollTop = scrollTop;
            }
        } else {
            this.mainVirtual.messages.push(message);
        }
    }

    onChatShowMessage = ({message}) => {
        if (this.isLoadingRecent) {
            return;
        }

        if (AppSelectedChat.check(message.to)) {
            let $message = getMessageElementById(message.id);

            if (!$message) {
                const messageIndex = this.mainVirtual.messages.findIndex(m => m.id === message.id);

                if (messageIndex > -1) {
                    this.cleanupTree();

                    this.mainVirtual.currentPage = this.mainVirtual.messages
                        .slice(Math.max(messageIndex - this.mainVirtual.edgeSize, 0), messageIndex + this.mainVirtual.edgeSize);

                    const messages = this.mainVirtual.currentPage;

                    this.prependMessages(messages, this.currentVirtual.getBeforePageTopOne(), this.currentVirtual.getAfterPageBottomOne());

                    $message = this.$el.querySelector(`#message-${message.id}`);
                } else {
                    const peer = AppSelectedChat.Current;

                    const actionCount = (++this.actionCount);

                    API.messages.getHistory(peer, {
                        offset_id: message.id,
                        add_offset: -51,
                        limit: 100
                    }).then(Messages => {
                        AppEvents.Peers.fire("chat.showMessageReady", {
                            peer,
                            messages: peer.messages.putRawMessages(Messages.messages),
                            offset_id: message.id,
                            actionCount,
                        })
                    });
                }
            }

            if ($message) {
                scrollToAndHighlight(this.$el, $message);
            } else {
                console.warn("No message to scroll found.")
            }
        } else {
            const peer = AppSelectedChat.Current;

            AppSelectedChat.select(message.to);

            const actionCount = (++this.actionCount);

            API.messages.getHistory(peer, {
                offset_id: message.id,
                add_offset: -51,
                limit: 100
            }).then(Messages => {
                AppEvents.Peers.fire("chat.showMessageReady", {
                    peer,
                    messages: peer.messages.putRawMessages(Messages.messages),
                    offset_id: message.id,
                    actionCount,
                })
            });
        }
    }

    onChatShowMessageReady = event => {
        if (this.isLoadingRecent) {
            return;
        }

        if (this.actionCount > event.actionCount) {
            return;
        }

        this.cleanupTree();
        this.secondVirtual.refresh();

        this.isUsingSecondVirtual = true;

        let messages = this.fixMessages(event.messages);

        const intersect = this.mainVirtual.isEmpty() ? -1 : findIntersection(messages, [this.mainVirtual.getVeryTopOne()]);

        if (intersect > -1) {
            console.log("[show message] intersect found");

            messages = messages.slice(intersect - 1);

            this.secondVirtual.messages.push(...messages);
            this.mainVirtual.messages = [...this.secondVirtual.messages, ...this.mainVirtual.messages];

            this.isUsingSecondVirtual = false;
            this.secondVirtual.refresh();

            messages = this.mainVirtual.nextBottom();
        } else {
            this.secondVirtual.messages.push(...messages);
            messages = this.secondVirtual.veryBottomPage();
        }

        this.appendMessages(messages, this.currentVirtual.getBeforePageTopOne(), this.currentVirtual.getAfterPageBottomOne());

        const $message = this.$el.querySelector(`#message-${event.offset_id}`);

        if ($message) {
            scrollToAndHighlight(this.$el, $message);
        } else {
            console.error("BUG: no message found to scroll");
        }
    }

    virtual_onScrolledTop = () => {
        if (this.isLoadingRecent) {
            return;
        }

        // console.log("scrolled top")

        if (this.currentVirtual.isVeryTop()) {
            if (!this.currentVirtual.hasMoreOnTopToDownload) {
                // console.log("!hasMoreOnTopToDownload", this.isUsingSecondVirtual);
            }

            if (this.currentVirtual.isDownloading) {
                // console.log("isDownloading", this.isUsingSecondVirtual);
            }

            if (this.currentVirtual.hasMoreOnTopToDownload && !this.currentVirtual.isDownloading) {
                console.log(this.currentVirtual.isEmpty())
                if (!this.currentVirtual.isEmpty()) {
                    this.currentVirtual.isDownloading = true;

                    // console.log("[top] downloading");

                    AppSelectedChat.current.messages.downloadNextTopPage(this.currentVirtual.getVeryTopOne().id, {
                        isUsingSecondVirtual: this.isUsingSecondVirtual
                    });
                }
            }

            return;
        }

        const messages = this.currentVirtual.nextTop();

        if (this.currentVirtual.currentPage.length > messages.length) {
            for (let i = 0; i < messages.length; i++) {
                vrdom_delete(this.bubblesInnerRef.$el.lastChild);
            }
        }

        this.prependMessages(messages, this.currentVirtual.getBeforePageTopOne(), this.currentVirtual.getAfterPageBottomOne());

        this.dev_checkTree();

        if (this.$el.scrollTop === 0) {
            let $first: HTMLElement = this.bubblesInnerRef.$el.childNodes[messages.length - 1];

            if ($first) {
                if ($first.nextElementSibling) {
                    this.$el.scrollTop = $first.nextElementSibling.offsetTop;
                } else {
                    this.$el.scrollTop = $first.offsetTop;
                }
            }
        }
    }

    onTopPageMessagesReady = (event) => {
        if (this.isLoadingRecent) {
            return;
        }

        this.currentVirtual.isDownloading = false;

        if (event.context.isUsingSecondVirtual && !this.isUsingSecondVirtual) {
            console.log("wat")
            this.secondVirtual.refresh();
            return;
        }

        const ivt = this.currentVirtual.isVeryTop();

        this.currentVirtual.hasMoreOnTopToDownload = event.messages.length === 100;

        this.currentVirtual.messages = [...this.fixMessages(event.messages), ...this.currentVirtual.messages];

        if (ivt) {
            this.virtual_onScrolledTop();
        }
    }

    virtual_onScrolledBottom = () => {
        if (this.isLoadingRecent) {
            return;
        }

        // console.log("on scrolled bottom");

        if (this.currentVirtual.isVeryBottom()) {
            if (this.currentVirtual.hasMoreOnBottomToDownload && !this.currentVirtual.isDownloading) {
                if (this.currentVirtual.messages.length > 0) {
                    this.currentVirtual.isDownloading = true;

                    // console.log("[bottom] downloading")

                    AppSelectedChat.current.messages.downloadNextBottomPage(this.currentVirtual.getVeryBottomOne().id, {
                        isUsingSecondVirtual: this.isUsingSecondVirtual
                    });
                }
            }

            // console.log("isVeryBottom")

            return;
        }

        if (this.virtual_isCompletelyBottom()) {
            return;
        }

        const messages = this.currentVirtual.nextBottom();

        for (let i = 0; i < Math.min(this.currentVirtual.currentPage.length, messages.length); i++) {
            vrdom_delete(this.bubblesInnerRef.$el.firstChild);
        }

        this.appendMessages(messages, this.currentVirtual.getBeforePageTopOne(), this.currentVirtual.getAfterPageBottomOne());

        this.dev_checkTree();
    }

    onBottomPageMessagesReady = (event) => {
        if (this.isLoadingRecent) {
            return;
        }

        //  main virtual should never fire this event
        if (!this.isUsingSecondVirtual) {
            this.secondVirtual.refresh();

            this.mainVirtual.isDownloading = false;
            return;
        }

        this.secondVirtual.isDownloading = false;

        let messages = this.fixMessages(event.messages);

        const ivt = this.secondVirtual.isVeryBottom();
        const intersect = this.mainVirtual.isEmpty() ? -1 : findIntersection(messages, [this.mainVirtual.getVeryTopOne()]);

        if (intersect > -1) {
            console.log("[bottom page] intersect found");

            messages = messages.slice(intersect - 1);

            this.mainVirtual.currentPage = this.secondVirtual.currentPage;

            this.secondVirtual.messages.push(...messages);
            this.mainVirtual.messages = [...this.secondVirtual.messages, ...this.mainVirtual.messages];

            this.isUsingSecondVirtual = false;

            // console.log(this.mainVirtual.currentPage)

            this.secondVirtual.refresh();
        } else {
            console.log("[bottom page] no intersect found");

            this.secondVirtual.messages.push(...messages);
        }

        if (ivt) {
            this.virtual_onScrolledBottom();
        }
    }

    virtual_isCompletelyBottom = () => {
        return !this.isUsingSecondVirtual && this.mainVirtual.isVeryBottom();
    }

    dev_checkTree = () => {
        if (__IS_DEV__) {
            if (this.bubblesInnerRef.$el.childElementCount < 60) {
                console.log("BUG: < 60 messages rendered!!!")
            }
        }
    }
}

export default NextBubblesComponent;