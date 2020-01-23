import MessageWrapperComponent from "./messageWrapperComponent"
import MessageTimeComponent from "./messageTimeComponent"
import TextWrapperComponent from "./textWrapperComponent";
import {FileAPI} from "../../../../../../api/fileAPI";
import {MediaViewerManager} from "../../../../../mediaViewerManager";
import Component from "../../../../../framework/vrdom/component";
import VRDOM from "../../../../../framework/vrdom";
import Message from "../../../messages/newMessage";

// const MessageMediaImage = ({src, size, alt = "", isThumb}) => {
//     let width = isThumb ? parseInt(size[0]) >= 460 ? "460px" : `${size[0]}px` : parseInt(size[0]) >= 480 ? "480px" : `${size[0]}px`
//     return (
//         <img className={["attachment", isThumb ? "attachment-thumb" : ""]}
//              css-width={width}
//              src={src}
//              alt={alt}/>
//     )
// }
//
// function ImageMessageComponent({message, image = false}) {
//     let classes = "bubble"
//
//     if (message.isRead) {
//         classes += " read"
//     }
//
//     let haveMsg = message.text.length > 0
//
//     if (image) {
//         return (
//             <MessageWrapperComponent message={message}>
//                 <div class={classes}>
//                     {haveMsg ? (
//                         <div class="message">
//                             <MessageMediaImage src={image.imgSrc} size={image.imgSize} isThumb={!!image.thumbnail}/>
//                             <span dangerouslySetInnerHTML={message.text}/>
//                             <MessageTimeComponent message={message}/>
//                         </div>
//                     ) : ""}
//                 </div>
//             </MessageWrapperComponent>
//         )
//     }
//
//     return (
//         <MessageWrapperComponent message={message}>
//             <div class={classes}>
//                 {haveMsg ? (
//                     <div class="message">
//                         <img src="" class="attachment"/>
//                         <span dangerouslySetInnerHTML={message.text}/>
//                         <MessageTimeComponent message={message}/>
//                     </div>
//                 ) : ""}
//             </div>
//         </MessageWrapperComponent>
//     )
// }

const openViewer = message => {
    MediaViewerManager.open(message)
}

export class PhotoComponent extends Component {
    constructor(props) {
        super(props);
        const photo = props.props.photo
        const max = FileAPI.getMaxSize(photo)
        if (FileAPI.hasThumbnail(photo)) {
            const thumbnail = FileAPI.getThumbnail(photo)
            photo.real = {
                src: thumbnail,
                sizes: [max.w, max.h],
                thumbnail: true
            }
        } else {
            photo.real = {
                src: "",
                sizes: [max.w, max.h],
                thumbnail: true
            }
        }
        this.state = {
            photo: photo
        }

        FileAPI.getFile(photo, max.type).then(file => {
            this.state.photo.real = {
                src: file,
                sizes: [max.w, max.h],
                thumbnail: false
            }
            this.__patch()
        })
    }

    h() {
        const thumb = this.state.photo.real.thumbnail
        return <div className="media-wrapper" onClick={l => openViewer(this.state.photo)}>
            <img src={this.state.photo.real.src} className={["attachment", "photo", thumb ? "attachment-thumb" : ""]}/>
            {
                thumb ?
                    <div className="progress">
                        <div className="pause-button">
                            <i className="tgico tgico-close"/>
                        </div>
                        <progress className="progress-circular big white"></progress>
                    </div>
                    : ""
            }
        </div>
    }
}

const MessageMediaImage = ({ message, src, alt = "", size, thumb}) => {
    const w = size[1] > 512 ? 512 / size[1] * size[0] : size[0]
    return (
        <div className="media-wrapper" onClick={l => openViewer(message)}>
            <img className={["attachment", "photo", thumb ? "attachment-thumb" : ""]}
                 src={src}
                 alt={alt} css-width={w + "px"} />
            {
                thumb ?
                    <div className="progress">
                        <div className="pause-button">
                            <i className="tgico tgico-close"/>
                        </div>
                        <progress className="progress-circular big white"></progress>
                    </div>
                    : ""
            }
        </div>
    )
}

const PhotoMessageComponent = ({ message }) => {
    let imageLoaded = message.media.photo.real;

    return (
        <MessageWrapperComponent message={message}>
            <div className="message no-pad">
                <MessageMediaImage message={message} src={imageLoaded ? imageLoaded.src : ""} size={imageLoaded ? imageLoaded.sizes : [0, 0]} thumb={!imageLoaded || imageLoaded.thumbnail}/>

                <TextWrapperComponent message={message}/>
            </div>
        </MessageWrapperComponent>
    )
}

export default PhotoMessageComponent