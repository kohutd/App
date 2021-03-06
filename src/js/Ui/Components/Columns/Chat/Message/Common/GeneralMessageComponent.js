import AppEvents from "../../../../../../Api/EventBus/AppEvents"
import type {BusEvent} from "../../../../../../Api/EventBus/EventBus"
import type {Message} from "../../../../../../Api/Messages/Message"
import TranslatableStatefulComponent from "../../../../../../V/VRDOM/component/TranslatableStatefulComponent"
import {isGrouping, isSameDate} from "../../messagesUtils"
import {isElementInViewport} from "../../../../../Utils/isElementInViewport"

type Props = {
    message: Message;
    observer: IntersectionObserver;
}

class GeneralMessageComponent extends TranslatableStatefulComponent<Props> {
    appEvents(E) {
        E.bus(AppEvents.Peers)
            .filter(event => event.peer === this.props.message.dialogPeer)
            .on("messages.deleted", this.onMessagesDeleted)
            .on("messages.readOut", this.onMessagesReadOut)
    }

    reactive(R) {
        R.object(this.props.message)
            .updateOn("edited")
            .updateOn("replyFound")
            .updateOn("forwardedFound")
    }

    componentWillMount(props) {

    }

    componentDidMount() {
        // this.props.message.show()

        if (this.props.observer) {
            this.props.observer.observe(this.$el)
        }
    }

    componentWillUnmount() {
        if (this.props.observer) {
            this.props.observer.unobserve(this.$el)
        }
    }

    onMessagesReadOut = ({maxId, prevMaxId}) => {
        const id = this.props.message.id

        if (id <= maxId && id > prevMaxId) {
            this.forceUpdate()
        }
    }

    onElementVisible() {
        this.props.message.show()

        if (!this.props.message.isInRead && isElementInViewport(document.getElementById("bubbles-inner"), this.$el)) {
            this.props.message.dialogPeer.api.readHistory(this.props.message.id)
        }
    }

    onElementHidden() {
        // console.log("hidden", this)
    }

    domSiblingUpdated(prevMessage, nextMessage) {
        const message = this.props.message;
        const isOut = !message.isPost && message.isOut;

        message.hideAvatar = true;

        let prevCurr = isGrouping(prevMessage, message);
        let currNext = isGrouping(message, nextMessage) && nextMessage !== message;
        if (!prevCurr && currNext) {
            message.tailsGroup = "s";
            // if (!isOut && nextMessage == null) message.hideAvatar = false;

            // if (!isOut) message.hideAvatar = false;
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
        if (!isOut && nextMessage === message) message.hideAvatar = false;

        this.state.showDate = !isSameDate(message.jsDate, prevMessage?.jsDate)

        this.forceUpdate();
    }


    onMessagesDeleted = (event: BusEvent) => {
        if (event.messages.indexOf(this.props.message.id) > -1) {
            this.forceUpdate();
        }
    }
}

export default GeneralMessageComponent