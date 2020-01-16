import ChatInfoStatusComponent from "./chatInfoStatusComponent"
import AppSelectedDialog from "../../../../../../api/dialogs/selectedDialog"
import ChatInfoAvatarComponent from "./chatInfoAvatarComponent"
import ChatInfoNameComponent from "./chatInfoNameComponent"

const ChatInfoComponent = {
    name: "ChatInfoComponent",
    reactive: {
        dialog: AppSelectedDialog.Reactive.Default // reactive property
    },
    h() {
        return (
            <div id="messages-wrapper-chat-info" className="chat-info">
                <div className="person">

                    <ChatInfoAvatarComponent/>

                    <div className="content">

                        <div className="top">
                            <ChatInfoNameComponent/>
                        </div>

                        <ChatInfoStatusComponent/>
                    </div>
                </div>
            </div>
        )
    }
}

export default ChatInfoComponent