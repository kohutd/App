import MessageWrapperFragment from "./common/MessageWrapperFragment"
import TextWrapperComponent from "./common/TextWrapperComponent";
import GeneralMessageComponent from "./common/GeneralMessageComponent"
import {PhotoComponent} from "../../basic/photoComponent";
import {PhotoMessage} from "../../../../../../api/messages/objects/PhotoMessage";
import {VideoMessage} from "../../../../../../api/messages/objects/VideoMessage";
import {VideoComponent} from "../../basic/videoComponent";
import type {BusEvent} from "../../../../../../api/eventBus/EventBus";

class GroupedMessageComponent extends GeneralMessageComponent {

    init() {
        super.init()
        this.reactive = {
            message: this.message
        }
    }

    h() {
        const text = this.message.text.length > 0 ? <TextWrapperComponent message={this.message}/> : ""

        return (
            <MessageWrapperFragment ref={`msg-${this.message.id}`} message={this.message} noPad showUsername={false} outerPad={text !== ""}>
                <div className="grouped">
                    {this.message.group && this.message.group.map(l => {
                        if(l instanceof PhotoMessage) {
                            return <PhotoComponent photo={l.raw.media.photo}/>
                        } else if(l instanceof VideoMessage) {
                            return <VideoComponent video={l.raw.media.document}/>
                        } else {
                            console.log(l)
                            debugger;
                        }
                    })}
                </div>
                {text}
            </MessageWrapperFragment>
        )
    }



    reactiveChanged(key: string, value: any, event: BusEvent) {
        super.reactiveChanged(key, value, event)
        console.log("reactiveChanged", key, value, event)
        if (key === "message") {
            if (event.type === "updateGrouped") {
                console.log("updateGrouped!", this.message.groupInitializer)
                this.__patch()
            }
        }
    }

}

export default GroupedMessageComponent