import {PeopleListItemFragment} from "./PeopleListItemFragment"
import AppEvents from "../../../../../Api/EventBus/AppEvents"
import TopPeers from "../../../../../Api/Peers/TopPeers"
import StatelessComponent from "../../../../../V/VRDOM/component/StatelessComponent"
import {Section} from "../../Fragments/Section";

export class CorrespondentsComponent extends StatelessComponent {

    hidden = false

    appEvents(E) {
        E.bus(AppEvents.Peers)
            .updateOn("gotCorrespondents")

        E.bus(AppEvents.Peers)
            .filter(event => TopPeers.correspondents.has(event.peer))
            .updateOn("updatePhotoSmall")
    }

    render() {
        if (TopPeers.correspondents.size === 0) {
            return (
                <div/>
            )
        }

        return (
            <div title="People" className="section">
                <div className="title">People</div>
                <div className="people-list">
                    {
                        Array.from(TopPeers.correspondents.values())
                            .map(c => <PeopleListItemFragment url={c.photo.smallUrl} name={c.name} peer={c}/>)
                    }
                </div>
            </div>
        )
    }
}