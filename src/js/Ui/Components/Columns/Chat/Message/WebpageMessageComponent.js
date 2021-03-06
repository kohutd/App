import GeneralMessageComponent from "./Common/GeneralMessageComponent";
import MessageWrapperFragment from "./Common/MessageWrapperFragment";
import TextWrapperFragment from "./Common/TextWrapperFragment";
import VUI from "../../../../VUI";
import BetterPhotoComponent from "../../../Basic/BetterPhotoComponent";

class WebpageMessageComponent extends GeneralMessageComponent {

    render({message, showDate}) {
        let webpage = message.raw.media.webpage;

        return (
            MessageWrapperFragment(
                {message, showDate},
                TextWrapperFragment({message},
                    <>
                        {webpage.url && <a href={webpage.url} target="_blank" className="box web rp">
                            <div className="quote">
                                {webpage.photo ? <BetterPhotoComponent photo={webpage.photo} calculateSize/> : ""}
                                {webpage.site_name ? <div className="name">{webpage.site_name}</div> : ""}
                                {webpage.title ? <div className="title">{webpage.title}</div> : ""}
                                {webpage.description ? <div className="text">{webpage.description}</div> : ""}
                            </div>
                        </a>}
                        {
                            webpage.cached_page
                            &&
                            <div className="instant-view-button"
                                 onClick={() => VUI.InstantView.open(webpage.cached_page, webpage.site_name, webpage.photo)}>
                                Instant View
                            </div>
                        }
                    </>),
            )
        );
    }
}

export default WebpageMessageComponent;