import MessageWrapperComponent from "./messageWrapperComponent"
import MessageTimeComponent from "./messageTimeComponent"
import TextWrapperComponent from "./textWrapperComponent";
import {FileAPI} from "../../../../../../api/fileAPI";

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

const MessageMediaImage = ({ src, alt = "", size, isThumb}) => {
    return (
        <div className="media-wrapper">
            <img className={["attachment", isThumb ? "attachment-thumb" : ""]}
                 src={src}
                 alt={alt} css-width={size[0] + "px"} />
            {
                isThumb ?
                    <div className="progress">
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
                <MessageMediaImage src={imageLoaded ? imageLoaded.src : ""} size={imageLoaded ? imageLoaded.sizes : [0, 0]} isThumb={!imageLoaded || !!imageLoaded.thumbnail}/>

                <TextWrapperComponent message={message}/>
            </div>
        </MessageWrapperComponent>
    )
}

export default PhotoMessageComponent