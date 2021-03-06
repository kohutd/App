import keval from "../../Keval/keval"
import AppCache from "../Cache/AppCache"
import API from "../Telegram/API"
import Settings from "../Settings/Settings"

export function logout() {

    keval.auth.clear()
    keval.clear()
    Settings.clear()
    if (AppCache.isReady) {
        indexedDB.deleteDatabase("cache");
    }
    localStorage.clear()
    API.auth.logOut().finally(() => {
        document.location.reload()
    })
    // return MTProto.logout().then(() => {
    //     for (const k of PeersStore.data.keys()) {
    //         PeersStore.data.get(k).clear()
    //     }
    //
    //     for (const k of DialogsStore.data.keys()) {
    //         DialogsStore.data.get(k).clear()
    //     }
    //
    //     DialogsManager.onLogout()
    //
    //     localStorage.removeItem("user")
    //     localStorage.removeItem("topPeers")
    //
    //     VApp.router.replace("/login")
    // })
}