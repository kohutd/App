import AppEvents from "../../../../../Api/EventBus/AppEvents"
import AppSelectedChat from "../../../../Reactive/SelectedChat"
import VComponent from "../../../../../V/VRDOM/component/VComponent"
import UIEvents from "../../../../EventBus/UIEvents"
import classNames from "../../../../../V/VRDOM/jsx/helpers/classNames"
import classIf from "../../../../../V/VRDOM/jsx/helpers/classIf"

class ChatInfoStatusComponent extends VComponent {
    state = {
        isLoading: false,
    };

    appEvents(E) {
        E.bus(AppEvents.Dialogs)
            .only(event => AppSelectedChat.check(event.dialog.peer))
            .on("updateActions")

        E.bus(AppEvents.Peers)
            .only(event => AppSelectedChat.check(event.peer))
            .on("updateUserStatus")
            .on("updateChatOnlineCount")
            .on("fullLoaded")

        E.bus(UIEvents.General)
            .on("chat.select")
            .on("chat.loading", this.onChatLoading)
    }

    render() {
        const isOnline = this.statusLine.online;
        const isLoading = this.statusLine.isAction || this.statusLine.isLoading;
        const text = this.statusLine.text;

        const classes = classNames(
            "info",
            classIf(isOnline, "online"),
            classIf(isLoading, "loading-text"),
        )

        return (
            <div className="bottom">
                <div hideIf={AppSelectedChat.isSelected && AppSelectedChat.Current.isSelf}
                     className={classes}>{text}</div>
            </div>
        )
    }

    get action() {
        if (AppSelectedChat.Current && AppSelectedChat.Current.dialog && AppSelectedChat.Current.dialog.actions.size > 0) {
            const action = AppSelectedChat.Current.dialog.actionText

            if (action) {
                return action.user + " " + action.action
            }
        }

        return false
    }


    get statusLine() {
        if (AppSelectedChat.isNotSelected) {
            return {}
        }

        const action = this.action

        if (action) {
            return {text: action, isAction: true, isLoading: false}
        }

        return AppSelectedChat.Current.statusString
    }

    onChatLoading = ({isLoading}) => {
        this.setState({
            isLoading
        });
    }
}

export default ChatInfoStatusComponent