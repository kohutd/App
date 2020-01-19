import MTProto from "../../mtproto"
import PeersManager from "../peers/peersManager"

/**
 * @param rawUpdate
 * @return {boolean}
 */
function hasUpdatePts(rawUpdate) {
    return rawUpdate.hasOwnProperty("pts")
}

/**
 * @param rawUpdate
 * @return {boolean}
 */
function hasUpdatePtsCount(rawUpdate) {
    return rawUpdate.hasOwnProperty("pts_count")
}


/**
 * @param state state
 * @param rawUpdate
 * @param onSuccess
 * @param onFail
 */
function checkUpdatePts(state, rawUpdate, {onSuccess, onFail}) {
    if (hasUpdatePts(rawUpdate) && hasUpdatePtsCount(rawUpdate)) {
        if ((state.pts + rawUpdate.pts_count) === rawUpdate.pts) {
            onSuccess(MTProto.UpdatesManager.UPDATE_CAN_BE_APPLIED)
        } else if ((state.pts + rawUpdate.pts_count) > rawUpdate.pts) {
            // console.debug("[default] update already processed")
            onSuccess(MTProto.UpdatesManager.UPDATE_WAS_ALREADY_APPLIED)
        } else {
            // console.warn("[default] update cannot be processed", rawUpdate._, state.pts, rawUpdate.pts_count, rawUpdate.pts)
            onFail(MTProto.UpdatesManager.UPDATE_CANNOT_BE_APPLIED)
        }
    }
    // else if (hasUpdatePts(rawUpdate)) {
        // if (state.pts === rawUpdate.pts) {
        //     onSuccess(MTProto.UpdatesManager.UPDATE_CAN_BE_APPLIED)
        // } else if (state.pts > rawUpdate.pts) {
        //     // console.debug("[default] [no pts_count] update already processed")
        //     onSuccess(MTProto.UpdatesManager.UPDATE_WAS_ALREADY_APPLIED)
        // } else {
        //     // console.warn("[default] [no pts_count] update cannot be processed", rawUpdate._, state.pts, rawUpdate.pts_count, rawUpdate.pts)
        //     onFail(MTProto.UpdatesManager.UPDATE_CANNOT_BE_APPLIED)
        // }
    // }
    else {
        // console.debug("[default] update has no pts")
        onSuccess(MTProto.UpdatesManager.UPDATE_HAS_NO_PTS)
    }
}

export class DefaultUpdatesProcessor {
    /**
     * @param {UpdateManager} updatesManager
     */
    constructor(updatesManager) {
        this.updatesManager = updatesManager

        this.differenceUpdateTypes = [
            "updates.differenceEmpty",
            "updates.differenceTooLong",
            "updates.difference",
            "updates.differenceSlice",
        ]

        this.queueIsProcessing = false
        this.isWaitingForDifference = false

        /**
         * @private
         */
        this.queue = []
    }

    applyUpdate(rawUpdate) {
        this.updatesManager.fire(rawUpdate)
    }

    enqueue(rawUpdate) {
        if (!this.isWaitingForDifference) {
            // should never be true, but who knows
            if (this.differenceUpdateTypes.includes(rawUpdate._)) {
                this.processDifference(rawUpdate)
            } else {
                this.queue.push(rawUpdate)

                this.processQueue()
            }
        } else {
            this.queue.push(rawUpdate)
            // console.warn("[default] waiting for diff")
        }
    }

    dequeue() {
        return this.queue.shift()
    }


    processQueue(next) {
        if ((next || this.queue.length > 0) && !this.queueIsProcessing) {
            if (this.isWaitingForDifference) {
                console.error("[default] BUG: processing queue while waiting for difference")
            }

            this.queueIsProcessing = true

            const rawUpdate = next ? next : this.dequeue()

            const self = this

            checkUpdatePts(self.updatesManager.State, rawUpdate, {
                onSuccess(type) {
                    if (type === MTProto.UpdatesManager.UPDATE_CAN_BE_APPLIED) {
                        self.updatesManager.State.pts = rawUpdate.pts
                        self.applyUpdate(rawUpdate)
                    } else if (type === MTProto.UpdatesManager.UPDATE_HAS_NO_PTS) {
                        self.applyUpdate(rawUpdate)
                    }

                    self.queueIsProcessing = false
                    self.processQueue()
                },
                onFail(type) {
                    self.isWaitingForDifference = true
                    self.queueIsProcessing = false

                    self.getDifference(self.updatesManager.State).then(rawDifference => {
                        self.processDifference(rawDifference)
                    }).catch(e => {
                        console.error("[default] BUG: difference obtaining failed", e)
                        self.isWaitingForDifference = false
                        self.processQueue()
                    })
                }
            })
        }
    }

    processDifference(rawDifference) {
        // console.debug("[default] got difference", rawDifference)

        if (rawDifference._ === "updates.difference") {

            rawDifference.users.forEach(user => PeersManager.setFromRawAndFire(user))
            rawDifference.chats.forEach(chat => PeersManager.setFromRawAndFire(chat))

            rawDifference.new_messages.forEach(message => {
                this.updatesManager.processUpdate("updateNewMessage", {
                    _: "updateNewMessage",
                    message,
                })
            })

            rawDifference.new_encrypted_messages.forEach(message => {
                this.updatesManager.processUpdate("updateNewEncryptedMessage", {
                    _: "updateNewEncryptedMessage",
                    message,
                })
            })

            rawDifference.other_updates.forEach(ou => {
                this.updatesManager.processUpdate(ou._, ou)
            })

            this.isWaitingForDifference = false
            this.updatesManager.State = rawDifference.state
            this.processQueue()

        } else if (rawDifference._ === "updates.differenceTooLong") {
            // console.warn("[default] difference too long", rawDifference)

            this.isWaitingForDifference = true

            // The difference is too long, and the specified state must be used to refetch updates.

            this.updatesManager.State.pts = rawDifference.pts

            this.getDifference(this.updatesManager.State).then(rawDifference => {
                this.processDifference(rawDifference)
            }).catch(e => {
                console.error("BUG: difference obtaining failed", e)

                this.isWaitingForDifference = false
                this.processQueue()
            })

        } else if (rawDifference._ === "updates.differenceEmpty") {
            // console.warn("[default] difference empty")

            this.updatesManager.State.date = rawDifference.date
            this.updatesManager.State.qts = rawDifference.qts

            this.isWaitingForDifference = false
            this.queueIsProcessing = false

            this.processQueue()

        } else if (rawDifference._ === "updates.differenceSlice") {

            // Incomplete list of occurred events.

            rawDifference.users.forEach(user => PeersManager.setFromRawAndFire(user))
            rawDifference.chats.forEach(chat => PeersManager.setFromRawAndFire(chat))

            rawDifference.new_messages.forEach(message => {
                this.updatesManager.processUpdate("updateNewMessage", {
                    _: "updateNewMessage",
                    message,
                })
            })

            rawDifference.new_encrypted_messages.forEach(message => {
                this.updatesManager.processUpdate("updateNewEncryptedMessage", {
                    _: "updateNewEncryptedMessage",
                    message,
                })
            })

            rawDifference.other_updates.forEach(ou => {
                this.updatesManager.processUpdate(ou._, ou)
            })

            this.updatesManager.State = rawDifference.intermediate_state

            this.getDifference(this.updatesManager.State).then(rawDifference => {
                this.processDifference(rawDifference)
            }).catch(e => {
                console.error("BUG: difference obtaining failed", e)

                this.isWaitingForDifference = false
                this.processQueue()
            })
        } else {
            console.error("BUG: invalid difference constructor")
        }
    }

    getDifference(State = this.updatesManager.State, onTooLong = undefined) {
        if (State.pts === undefined || this.updatesManager.State.pts === undefined) {
            debugger
        }

        return MTProto.invokeMethod("updates.getDifference", {
            pts: State.pts || this.updatesManager.State.pts,
            date: State.date || this.updatesManager.State.date,
            qts: State.qts || this.updatesManager.State.qts,
            pts_total_limit: 100,
            flags: 0
        }).then(rawDifference => {
            return rawDifference
        })
    }
}