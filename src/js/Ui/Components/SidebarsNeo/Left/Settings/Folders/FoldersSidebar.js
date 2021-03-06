import {LeftSidebar} from "../../LeftSidebar";
import filters from "../../../../../../../../public/static/animated/filters";
import VButton from "../../../../../Elements/Button/VButton";
import {Section} from "../../../Fragments/Section";
import FoldersManager from "../../../../../../Api/Dialogs/FolderManager";
import IconButton from "../../../Fragments/IconButton";
import Button from "../../../Fragments/Button";
import Subheader from "../../../Fragments/Subheader";
import Animated from "../../../Fragments/Animated";
import UIEvents from "../../../../../EventBus/UIEvents";
import AppEvents from "../../../../../../Api/EventBus/AppEvents";
import {CreateFolderSidebar} from "./CreateFolderSidebar";

export class FoldersSidebar extends LeftSidebar {
    appEvents(E) {
        super.appEvents(E)
        E.bus(AppEvents.General)
            .updateOn("foldersUpdate")
            .updateOn("suggestedFoldersUpdate")
    }

    content(): * {
        const suggested = FoldersManager.getSuggestedFolders()

        return <this.contentWrapper>
            <Animated animationData={filters} hidden={this.state.reallyHidden}/>

            <Subheader>
                {this.l("lng_filters_about")}
            </Subheader>
            <VButton isRound onClick={this.createFolder}><i className="tgico-add"/>{this.l("lng_filters_create")}</VButton>

            <Section title={this.l("lng_filters_title")}>
                {FoldersManager.folders.map(l => {
                    const count = FoldersManager.getBadgeCount(l.id, false).count;
                    return <Button text={l.title} description={this.lp("lng_filters_chats_count", count, {count: count})} onClick={_ => this.editFolder(l.id)}/>
                })}
            </Section>

            {suggested.length > 0 ?
                <Section title={this.l("lng_filters_recommended")}>
                    {suggested.map(l => {
                        return <IconButton icon="add" text={l.filter.title} description={l.description}
                                                       onClick={_ => this.addRecommendedFolder(l)}/>
                    })}
                </Section>
                : ""}
        </this.contentWrapper>
    }


    editFolder = (folderId) => {
        UIEvents.Sidebars.fire("push", {
            sidebar: CreateFolderSidebar,
            isNewFolder: false,
            folderId
        })
    }

    createFolder = (folder) => {
        UIEvents.Sidebars.fire("push", {
            sidebar: CreateFolderSidebar,
            isNewFolder: true,
            folderId: null
        })
    }

    addRecommendedFolder = (suggested) => {
        const filter = suggested.filter
        filter.id = FoldersManager.folders.length === 0 ? 2 : FoldersManager.folders.reduce((l, q) => {
            return l.id < q.id ? q : l
        }).id + 1
        FoldersManager.suggestedFolders.splice(FoldersManager.suggestedFolders.indexOf(suggested), 1)

        FoldersManager.updateFolder(filter)

    }

    get headerBorder(): boolean {
        return false
    }

    get title(): string | * {
        return this.l("lng_filters_title")
    }

}