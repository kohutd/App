import StatefulComponent from "../../../V/VRDOM/component/StatefulComponent"
import AvatarUploadModal from "../Modals/AvatarUploadModal"
import VUI from "../../VUI"
import "./AvatarUploadComponent.scss"

export default class AvatarUploadComponent extends StatefulComponent {
    state = {
        avatarUrl : this.props.url || ""
    }

    render({}, {avatarUrl}) {
        return (<div class="avatar-upload" onClick={this.openUploadModal}>
            <div class="image-container" css-background-image={`url(${avatarUrl})`}>
                {!avatarUrl && <i class="tgico tgico-cameraadd"/>}
            </div>
        </div>)
    }

    openUploadModal = () => {
        VUI.Modal.open(<AvatarUploadModal onDone={this.props.onAvatarUpdated}/>)
    }

    componentWillUpdate(nextProps, nextState) {
        if(!this.state.avatarUrl && nextProps.url) {
            this.state.avatarUrl = nextProps.url
        }
    }
}