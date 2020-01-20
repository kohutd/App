import DialogsManager from "../../../api/dialogs/dialogsManager"
import {DialogListComponent} from "./components/dialog/dialogListComponent"
import UpdatesManager from "../../../api/updates/updatesManager"
import PeersManager from "../../../api/peers/peersManager"
import ChatComponent from "./components/chat/chatComponent"
import {LocaleController} from "../../../common/locale/localization"

function initUIManagers() {
    UpdatesManager.init().then(() => {
        DialogsManager.init()
        PeersManager.init()
    })
    LocaleController.init();
}

export function MainPage() {
    initUIManagers()

    return (
        <div class="app">
            <DialogListComponent/>
            <ChatComponent/>
        </div>
    )
}
