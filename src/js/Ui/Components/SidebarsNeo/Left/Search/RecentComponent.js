import DialogsStore from "../../../../../Api/Store/DialogsStore"
import {UserPeer} from "../../../../../Api/Peers/Objects/UserPeer"
import AppEvents from "../../../../../Api/EventBus/AppEvents"
import AppSelectedChat from "../../../../Reactive/SelectedChat"
import {BotPeer} from "../../../../../Api/Peers/Objects/BotPeer"
import ContactComponent from "../../../Basic/ContactComponent"
import List from "../../../../../V/VRDOM/list/List"
import VArray from "../../../../../V/VRDOM/list/VArray"
import StatefulComponent from "../../../../../V/VRDOM/component/StatefulComponent"
import {Section} from "../../Fragments/Section";
import Locale from "../../../../../Api/Localization/Locale"

const ContactFragmentItemTemplate = (peer) => {
    return <ContactComponent peer={peer}
                             fetchFull={true}
                             name={peer.name}
                             status={() => Locale.lp(peer.status)}
                             onClick={() => AppSelectedChat.select(peer)}/>
}

export class RecentComponent extends StatefulComponent {

    state = {
        peers: new VArray()
    }

    appEvents(E) {
        E.bus(AppEvents.Peers)
            .only(event => this.state.peers.items.indexOf(event.peer) > -1)
            .on("updateUserStatus")
            .on("updatePhoto")
            .on("updatePhotoSmall")
    }

    componentDidMount() {
        this.refreshRecent()
    }

    render() {
        return (
            <Section title="Recent">
                <List list={this.state.peers}
                      template={ContactFragmentItemTemplate}
                      wrapper={<div className="column-list"/>}/>
            </Section>
        )
    }

    getRecent = () => {
        return DialogsStore.sort()
            .filter(dialog => dialog.peer instanceof UserPeer && !(dialog.peer instanceof BotPeer) && !dialog.peer.isSelf && dialog.peer.id !== 777000)
            .slice(0, 6)
            .map(dialog => dialog.peer)
    }

    refreshRecent = () => {
        this.state.peers.set(this.getRecent())
    }
}