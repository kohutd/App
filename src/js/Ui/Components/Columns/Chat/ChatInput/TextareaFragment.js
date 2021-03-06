import {replaceEmoji} from "../../../../Utils/replaceEmoji";
import {AttachLinkModal} from "../../../Modals/AttackLinkModal";
import UIEvents from "../../../../EventBus/UIEvents"
import VUI from "../../../../VUI"
import TranslatableStatelessComponent from "../../../../../V/VRDOM/component/TranslatableStatelessComponent"

export class TextareaFragment extends TranslatableStatelessComponent {

    render() {
        return <div className="textarea empty"
                    placeholder={this.l("lng_message_ph", {}, "Write a message...")}
                    contentEditable
                    onInput={this.onInput}
                    onKeyPress={this.onKeyPress}
                    onKeyDown={this.onKeyDown}
                    onContextMenu={this.contextMenu}
                    onPaste={this.onPaste}
                    tabindex="-1">
        </div>
    }

    componentDidMount() {
        this.parent = this.props.parent
    }

    onKeyDown = (ev) => {
        // Ctrl + Shift + M
        if (ev.keyCode === 77 && ev.shiftKey && ev.ctrlKey) {
            ev.preventDefault()
            this.monospace()
        }

        // Ctrl + K
        if (ev.keyCode === 75 && ev.ctrlKey) {
            ev.preventDefault()
            this.createLink()
        }

        // Ctrl + Shift + X
        if (ev.keyCode === 88 && ev.shiftKey && ev.ctrlKey) {
            ev.preventDefault()
            this.strikethrough()
        }

        // Alt + N
        if (ev.keyCode === 78 && ev.altKey) {
            ev.preventDefault()
            this.clear()
        }
    }

    createLink = () => {
        this.restoreSelection()
        this.saveSelection()
        let text = null
        if (document.activeElement === this.$el) {
            text = window.getSelection().toString()
        }
        // todo move this blur & focus to modalmanager
        this.$el.blur()
        VUI.Modal.open(<AttachLinkModal text={text} close={this.linkCreated.bind(this)}/>)
    }

    clearInput = () => {
        this.$el.innerHTML = ""
        this.onInput()
        this.clear()
    }

    saveSelection = () => {
        let sel = window.getSelection();
        this.range = sel.getRangeAt(0);
    }

    restoreSelection = () => {
        if (this.range) {
            let sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.range);
        }
        this.range = null
    }

    linkCreated = (text, url) => {
        this.formatBlock("createLink", url)
        if (text) document.execCommand("insertText", false, text)
    }

    formatBlock = (tag, param) => {
        this.$el.focus()
        this.restoreSelection()
        document.execCommand(tag, false, param)
    }

    bold = () => {
        this.formatBlock("bold")
    }

    italic = () => {
        this.formatBlock("italic")
    }

    strikethrough = () => {
        this.formatBlock("strikeThrough")
    }

    underline = () => {
        this.formatBlock("underline")
    }

    monospace = () => {
        // HACK!
        // Unfortunately execCommand has no way to insert <code> directly.
        // Well, screw it, I ain't no worried about hacks anymore!
        // Let it be something else right?
        this.$el.classList.add("monospace-hack")
        this.formatBlock("subscript")
        this.$el.classList.remove("monospace-hack")
    }

    clear = () => {
        this.formatBlock("removeFormat")
    }

    onKeyPress = (ev) => {
        if ((ev.which === 13 || ev.which === 10) && !ev.shiftKey && !ev.ctrlKey) {
            this.parent.send()
            ev.preventDefault()
        }
    }


    onPaste = (ev) => {
        // this.$el.focus()

        if (this.$el === document.activeElement) {
            ev.preventDefault()

            const text = (ev.originalEvent || ev).clipboardData.getData('text/plain')

            document.execCommand("insertText", false, text)
        }
        const item = Array.from(ev.clipboardData.items).find(el => el.type.includes("image"));
        if(item) this.parent.pickMedia(item.getAsFile())
        /*for (let i = 0; i < ev.clipboardData.items.length; i++) {
            const k = ev.clipboardData.items[i]
            if (k.type.indexOf("image") === -1) continue
            this.parent.pickMedia(k.getAsFile())
        }*/
    }


    onInput = (ev) => {
        this.parent.updateSendButton()
        replaceEmoji(this.$el)
        UIEvents.General.fire("textarea.onInput", {
            textarea: this,
        })
    }

    contextMenu = l => {
        this.saveSelection()
        VUI.ContextMenu.listener([
            {
                title: this.l("lng_menu_formatting_bold"),
                after: "Ctrl+B",
                onClick: this.bold
            },
            {
                title: this.l("lng_menu_formatting_italic"),
                after: "Ctrl+I",
                onClick: this.italic
            },
            {
                title: this.l("lng_menu_formatting_underline"),
                after: "Ctrl+U",
                onClick: this.underline
            },
            {
                title: this.l("lng_menu_formatting_strike_out"),
                after: "Ctrl+Shift+X",
                onClick: this.strikethrough
            },
            {
                title: this.l("lng_menu_formatting_monospace"),
                after: "Ctrl+Shift+M",
                onClick: this.monospace
            },
            {
                title: this.l("lng_menu_formatting_link_create"),
                after: "Ctrl+K",
                onClick: this.createLink
            },
            {
                title: this.l("lng_menu_formatting_clear"),
                after: "Alt+N",
                onClick: this.clear
            }
        ])(l)

    }

}