import {LeftSidebar} from "../../LeftSidebar";
import filtersNew from "../../../../../../../../public/static/animated/filter_new";
import Animated from "../../../Fragments/Animated";
import Subheader from "../../../Fragments/Subheader";
import VInput from "../../../../../Elements/Input/VInput";
import {Section} from "../../../Fragments/Section";
import IconButton from "../../../Fragments/IconButton";
import nodeIf from "../../../../../../V/VRDOM/jsx/helpers/nodeIf";
import PeersStore from "../../../../../../Api/Store/PeersStore";
import AvatarButton from "../../../Fragments/AvatarButton";
import FoldersManager from "../../../../../../Api/Dialogs/FolderManager";
import VUI from "../../../../../VUI";
import UIEvents from "../../../../../EventBus/UIEvents";
import {FolderPeersSidebar} from "./FolderPeersSidebar";
import AppEvents from "../../../../../../Api/EventBus/AppEvents";

export class CreateFolderSidebar extends LeftSidebar {
    content(): * {
        const f = this.state.currentFolder || {
            include_peers: [],
            pinned_peers: [],
            exclude_peers: []
        }

        return <this.contentWrapper>
            <Animated animationData={filtersNew} hidden={this.state.reallyHidden}/>
            <Subheader>
                Choose chats and type of chats that will appear and never appear in this folder.
            </Subheader>

            <Section>
                <VInput label="Folder Name" value={f.title || ""} onInput={this.onChangeTitle}/>
            </Section>


            <Section title="Included chats">
                <IconButton icon="add" text="Add Chats" blue onClick={this.includeChats}/>
                {nodeIf(<IconButton icon="newprivate" text="Contacts"/>, f.contacts)}
                {nodeIf(<IconButton icon="noncontacts" text="Non-Contacts"/>, f.non_contacts)}
                {nodeIf(<IconButton icon="newgroup" text="Groups"/>, f.groups)}
                {nodeIf(<IconButton icon="newchannel" text="Channels"/>, f.broadcasts)}
                {nodeIf(<IconButton icon="bots" text="Bots"/>, f.bots)}

                {f.pinned_peers.map(inputPeer => {
                    const peer = PeersStore.getByPeerType(inputPeer)
                    return <AvatarButton peer={peer} isNameAsText/>
                })}

                {f.include_peers.map(inputPeer => {
                    const peer = PeersStore.getByPeerType(inputPeer)
                    return <AvatarButton peer={peer} isNameAsText/>
                })}
            </Section>

            <Section title="Excluded chats">
                <IconButton icon="minus" text="Remove Chats" blue onClick={this.excludeChats}/>
                {nodeIf(<IconButton icon="mute" text="Muted"/>, f.exclude_muted)}
                {nodeIf(<IconButton icon="readchats" text="Read"/>, f.exclude_read)}
                {nodeIf(<IconButton icon="archive" text="Archived"/>, f.exclude_archived)}

                {f.exclude_peers.map(inputPeer => {
                    const peer = PeersStore.getByPeerType(inputPeer)
                    return <AvatarButton peer={peer} isNameAsText/>
                })}
            </Section>
        </this.contentWrapper>
    }

    appEvents(E) {
        super.appEvents(E);
        E.bus(AppEvents.General)
            .on("folderUpdateFailed", this.onError)
            .on("folderUpdateSuccess", this.onSuccess)
        E.bus(UIEvents.General)
            .on("folderPeersChanged", this.onFolderPeersChanged)
    }

    onError = (event) => {
        if(event.error.type === "FILTER_INCLUDE_EMPTY") {
            UIEvents.General.fire("snackbar.show", {text: "There are no included chats in a folder", time: 5});
        }
    }

    onFolderPeersChanged = (event) => {
        this.setState({
            currentFolder: event.folder
        })
    }

    onSuccess = (event) => {
        UIEvents.Sidebars.fire("pop", this)
    }

    onChangeTitle = (event) => {
        this.state.currentFolder.title = event.target.value
        this.forceUpdate()

    }

    includeChats = () => {
        UIEvents.Sidebars.fire("push", {
            sidebar: FolderPeersSidebar,
            exclude: false,
            folder: this.state.currentFolder
        })
    }

    excludeChats = () => {
        UIEvents.Sidebars.fire("push", {
            sidebar: FolderPeersSidebar,
            exclude: true,
            folder: this.state.currentFolder
        })
    }

    apply = () => {
        delete this.state.currentFolder.flags;
        FoldersManager.updateFolder(this.state.currentFolder)
    }


    get rightButtons(): *[] {
        const buttons = []
        if(this.state.currentFolder && this.state.currentFolder.title) {
            buttons.push({
                    icon: "check",
                    blue: true,
                    onClick: _ => this.apply()
                })
        }
        if(this.state.isNewFolder) {
            return buttons
        }
        buttons.push({
            icon: "more",
            onClick: event => VUI.ContextMenu.openBelow([
                {
                    icon: "delete",
                    title: "Delete Folder",
                    red: true,
                    onClick: this.deleteFolder
                }
            ], event.target)
        })
        return buttons
    }

    deleteFolder = () => {
        FoldersManager.deleteFolder(this.state.currentFolder.id)
        UIEvents.Sidebars.fire("pop", this)
    }

    get headerBorder(): boolean {
        return false
    }

    onShown(params) {
        this.setState({
            currentFolder: params.folderId == null ? {
                // Get max id + 1
                _: "dialogFilter",
                id: FoldersManager.folders.length === 0 ? 2 : FoldersManager.folders.reduce((l, q) => {
                    return l.id < q.id ? q : l
                }).id + 1,
                include_peers: [],
                exclude_peers: [],
                pinned_peers: []
            } : Object.assign({}, FoldersManager.getFolder(params.folderId)),
            isNewFolder: params.isNewFolder
        })
    }

    get title(): string | * {
        return this.state.currentFolder == null ? "New Folder" : "Edit Folder"
    }
}