import AppSelectedInfoPeer from "../../../../../Reactive/SelectedInfoPeer";

export const ForwardedHeaderFragment = ({message}) => {
    if (!message.raw.fwd_from || !message.forwarded) {
        return <div/>
    } /*else if (!message.forwarded) {
        return <div id={`message-${message.id}-fwd`} className="fwd">...</div>
    }*/

    if (typeof message.forwarded === "string") {
        return <div id={`message-${message.id}-fwd`} className="fwd">
            Forwarded from <span className="no-bold">
                {message.forwarded}
            </span>
        </div>
    } else {
        return <div id={`message-${message.id}-fwd`} className="fwd">
            Forwarded from <span className="clickable-name"
                                onClick={() => AppSelectedInfoPeer.select(message.forwarded)}>
                {message.forwarded.name}
            </span>
        </div>
    }
}