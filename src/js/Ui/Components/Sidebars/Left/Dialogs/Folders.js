import "./Folders.scss";
import AppEvents from "../../../../../Api/EventBus/AppEvents";
import type {AE} from "../../../../../V/VRDOM/component/__component_appEventsBuilder";
import FoldersManager from "../../../../../Api/Dialogs/FolderManager";
import VUI from "../../../../VUI";
import {BurgerAndBackComponent} from "../BurgerAndBackComponent";
import StatefulComponent from "../../../../../V/VRDOM/component/StatefulComponent"
import UIEvents from "../../../../EventBus/UIEvents";
import TabSelectorComponent from "../../../Tab/TabSelectorComponent";
import classIf from "../../../../../V/VRDOM/jsx/helpers/classIf";

const FolderFragment = ({folderId, icon, title, badge = {active: false, count: 0}, selected = false, onClick}) => {
    return <div className={{
        folder: true,
        item: true,
        rp: true,
        rps: true,
        selected,
    }} onClick={onClick} onContextMenu={folderId && VUI.ContextMenu.listener([
        {
            icon: "edit",
            title: "Edit Folder",
            onClick: _ => {
                // TODO edit folder
            }
        },
        {
            icon: "delete",
            title: "Remove",
            red: true,
            onClick: _ => {
                FoldersManager.deleteFolder(folderId)
            }
        },
    ])}>
        <span className="title">
            {title}
            <span className={{"badge": true, "active": badge.active}}>{badge.count <= 0 ? "" : badge.count}</span>
        </span>
    </div>
}

export class Folders extends StatefulComponent {
    state = {
        folders: [],
        selectedFolder: null
    }

    appEvents(E: AE) {
        E.bus(AppEvents.General)
            .on("foldersUpdate", this.onFoldersUpdate)
            .on("selectFolder", this.onSelectFolder)
        // TODO handle *seen* event to decrease number
        E.bus(AppEvents.Dialogs)
            .on("gotMany", this.updateCounters)
            .on("gotNewMany", this.updateCounters)
    }

    init() {
        super.init()
        FoldersManager.fetchFolders()
    }


    render() {
        return <div class={{
            "folder-list": true,
            "tab-selector": true,
            "hidden": !FoldersManager.hasFolders(),
            "scrollable-x": true,
            "hide-scroll": true
        }}>
            {/*<BurgerAndBackComponent isMain/>*/}

            <FolderFragment title="All" selected={this.state.selectedFolder == null}
                            badge={FoldersManager.getBadgeCount(null)}
                            onClick={_ => FoldersManager.selectFolder(null)}/>
            {this.state.folders.map(l => {
                return <FolderFragment title={l.title}
                                       selected={l.id === this.state.selectedFolder}
                                       badge={FoldersManager.getBadgeCount(l.id)} folderId={l.id}
                                       onClick={_ => FoldersManager.selectFolder(l.id)}/>
            })}
        </div>
    }
    //
    // componentDidMount() {
    //     super.componentDidMount();
    //
    //     this.$el.addEventListener('wheel', this.transformScroll);
    // }

    editFolders = () => {

        // UIEvents.LeftSidebar.fire("show", {
        //     barName: "settings"
        // })
        // UIEvents.LeftSidebar.fire("show", {
        //     barName: "folder-settings"
        // })
        // FoldersManager.getSuggestedFolders()
    }

    onFoldersUpdate = (event) => {
        this.state.folders = []
        this.setState({
            folders: event.folders
        })
    }

    onSelectFolder = (event) => {
        this.setState({
            selectedFolder: event.folderId
        })
    }

    updateCounters = (event) => {
        this.forceUpdate()
    }
}