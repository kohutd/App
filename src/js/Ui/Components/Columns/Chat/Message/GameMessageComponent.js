import MessageWrapperFragment from "./Common/MessageWrapperFragment"
import GeneralMessageComponent from "./Common/GeneralMessageComponent"
import {parseMessageEntities} from "../../../../../Utils/htmlHelpers"
import BetterPhotoComponent from "../../../Basic/BetterPhotoComponent"

class GameMessageComponent extends GeneralMessageComponent {

    render() {
        let game = this.message.raw.media.game

        //DRAFT VERSION
        return (
            <MessageWrapperFragment message={this.message} showUsername={false} avatarRef={this.avatarRef}
                                    bubbleRef={this.bubbleRef}>
                <div class="game">
                    <div class="title">{game.title}</div>
                    <div class="info">
                        {this.message.text ? parseMessageEntities(this.message.text) : game.description}
                    </div>
                    <BetterPhotoComponent photo={game.photo}/>
                </div>
            </MessageWrapperFragment>
        )
    }
}

export default GameMessageComponent