import AppSelectedInfoPeer from "../../Reactive/SelectedInfoPeer"

const AvatarFragment = ({peer, saved, onClick}) => {
    if (!peer) {
        return (
            <div className={`avatar placeholder-0`}>
                <span>?</span>
                <div className="avatar-outer" css-opacity="0"/>
            </div>
        )
    }

    let photo = peer.photo
    let deleted = peer.isDeleted
    let hasAvatar = !photo.isEmpty && !photo._isFetchingSmall

    if (!onClick) {
        onClick = () => AppSelectedInfoPeer.select(peer)
    }

    if (saved && peer.isSelf) {
        return (
            <div onClick={onClick}
                 className="avatar placeholder-saved placeholder-icon">
                <i className="tgico tgico-avatar_savedmessages"/>
            </div>
        )
    }

    if (deleted) {
        return (
            <div className={`avatar placeholder-${photo.letter.num} placeholder-icon`}>
                <i className="tgico tgico-avatar_deletedaccount"/>
            </div>
        )
    }

    if (hasAvatar) {
        return (
            <div onClick={onClick}
                 className="avatar"
                 css-background-image={`url(${photo.smallUrl})`}>
            </div>
        )
    } else {
        return (
            <div onClick={onClick}
                 className={`avatar placeholder-${photo.letter.num}`}>
                <span>{photo.letter.text}</span>
                <div className="avatar-outer" css-opacity="0"/>
            </div>
        )
    }
}

export default AvatarFragment