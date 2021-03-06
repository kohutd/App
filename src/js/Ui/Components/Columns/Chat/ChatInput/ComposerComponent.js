import lottie from "../../../../../../../vendor/lottie-web"
import StatelessComponent from "../../../../../V/VRDOM/component/StatelessComponent"
import StickersComposerComponent from "./StickersComposerComponent"
import EmojiComposerComponent from "./EmojiComposerComponent"
import UIEvents from "../../../../EventBus/UIEvents"
import GifsComposerComponent from "./GifsComposerComponent"
import {ChatInputManager} from "./ChatInputComponent"
import {StickerSearchSidebar} from "../../../SidebarsNeo/Right/StickerSearch/StickerSearchSidebar"
import {GifSearchSidebar} from "../../../SidebarsNeo/Right/GifSearch/GifSearchSidebar"

export default class ComposerComponent extends StatelessComponent {
    identifier = "composer";

    stateless = {
        panel: "emoji",
        stickerSet: null,
        allStickers: [],
    };

    render() {
        return (
            <div class="composer" onMouseEnter={this.props.mouseEnter} onMouseLeave={this.props.mouseLeave}>
                <div class="content">
                    <EmojiComposerComponent/>
                    <StickersComposerComponent/>
                    <GifsComposerComponent/>
                </div>
                <div className="composer-tab-selector">
                    <div css-visibility="hidden" id="composer-stickers-search-button" 
                        className="item rp rps" onClick={this.openSearch}>
                        <i className="tgico tgico-search"/>
                    </div>
                    <div class="filler"/>
                    <div data-tab-name="emoji" className="item rp rps selected" onClick={this.onClickOpenEmoji}>
                        <i class="tgico tgico-smile"/>
                    </div>
                    <div data-tab-name="stickers" className="item rp rps" onClick={this.onClickOpenStickers}>
                        <i class="tgico tgico-stickers"/>
                    </div>
                    <div data-tab-name="gif" className="item rp rps" onClick={this.onClickOpenGif}>
                        <i class="tgico tgico-gifs"/>
                    </div>
                    <div class="filler"/>
                    <div className="item rp rps" id="composer-emoji-backspace-button" onClick={this.onBackspaceClick}>
                        <i class="tgico tgico-deleteleft"/>
                    </div>
                </div>
            </div>
        )
    }

    componentDidMount() {
        this.$emojiPanel = this.$el.querySelector(".emoji-wrapper");
        this.$stickersPanel = this.$el.querySelector(".sticker-wrapper");
        this.$gifPanel = this.$el.querySelector(".gif-wrapper");
    }

    show = () => {
        this.$el.classList.add("visible");
        this.visible = true;
        this.onShow();
    }

    hide = () => {
        this.$el.classList.remove("visible");
        this.visible = false;
        this.onHide();
    }

    toggle = (show) => {
        if (!show || this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    onHide = () => {
        window.document.getElementById("chat").classList.remove("composer-opened");
        UIEvents.General.fire("composer.hide", {panel: this.stateless.panel})
        ChatInputManager.updateEmojiButton();
    }

    onShow = () => {
        window.document.getElementById("chat").classList.add("composer-opened"); //for phones
        UIEvents.General.fire("composer.show", {panel: this.stateless.panel})
        ChatInputManager.updateEmojiButton();
    }

    togglePanel = (name: string) => {
        document.getElementById("composer-stickers-search-button").style.visibility = "hidden";
        document.getElementById("composer-emoji-backspace-button").style.visibility = "hidden";

        if (name === "stickers" || name === "gif") {
            document.getElementById("composer-stickers-search-button").style.visibility = "visible";
        }

        if (name === "emoji") {
            document.getElementById("composer-emoji-backspace-button").style.visibility = "visible";
        }

        if (this.stateless.panel === name) {
            return;
        }

        this.$el.querySelector(".composer-tab-selector").childNodes.forEach($node => {
            $node.classList.remove("selected");
        });

        this.$el.querySelector(`.composer-tab-selector > [data-tab-name=${name}]`).classList.add("selected");

        this.$emojiPanel.classList.add("hidden");
        this.$gifPanel.classList.add("hidden");
        this.$stickersPanel.classList.add("hidden");

        this[`$${name}Panel`].classList.remove("hidden");

        this.stateless.panel = name;

        UIEvents.General.fire("composer.togglePanel", {
            panel: name,
        })
    }

    onClickOpenEmoji = () => {
        this.togglePanel("emoji");
    }

    onClickOpenStickers = () => {
        this.togglePanel("stickers");
    }

    onClickOpenGif = () => {
        this.togglePanel("gif");
    }

    openSearch = () => {
        const name = this.stateless.panel;
        if(name === "stickers") {
            UIEvents.Sidebars.fire("push", StickerSearchSidebar)
        }
        if(name === "gif") {
            UIEvents.Sidebars.fire("push", GifSearchSidebar)
        }
    }

    onBackspaceClick = () => {
        ChatInputManager.backspace();
    }
}