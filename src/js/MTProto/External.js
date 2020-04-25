// USE THIS THING ONLY OUTSIDE AND NEVER INSIDE mtproto FOLDER

import MobileProtoWorker from "./Worker/MTProto.worker"
import UpdatesManager from "../Api/Updates/UpdatesManager"
import AppEvents from "../Api/EventBus/AppEvents"

// USE THIS THING ONLY OUTSIDE AND NEVER INSIDE mtproto FOLDER
const TimeManager = {
    lastMessageID: [],
    timeOffset: 0,
    now(seconds) {
        let t = +new Date() + (this.timeOffset || 0)
        return seconds ? Math.floor(t / 1000) : t
    },
    generateMessageId() {
        return MTProto.performWorkerTask("time_generateMessageId").then(data => {
            return data.messageId;
        })
    }
}

// USE THIS THING ONLY OUTSIDE AND NEVER INSIDE mtproto FOLDER
let lastTaskId = 0
let waitingTasks = new Map()

// USE THIS THING ONLY OUTSIDE AND NEVER INSIDE mtproto FOLDER
const MTProtoWorker = new MobileProtoWorker()

// USE THIS THING ONLY OUTSIDE AND NEVER INSIDE mtproto FOLDER
MTProtoWorker.addEventListener("message", event => {
    if (event.data.time) {
        TimeManager.lastMessageID = event.data.time.lastMessageID
        TimeManager.timeOffset = event.data.time.timeOffset
    }

    switch (event.data.type) {
        case "update":
            MTProto.UpdatesManager.process(event.data.update)
            break

        case "connectionLost":
            AppEvents.General.fire("connectionLost")
            break

        case "connectionRestored":
            AppEvents.General.fire("connectionRestored")
            break

        case "syncTime":
            TimeManager.lastMessageID = event.data.time.lastMessageID
            TimeManager.timeOffset = event.data.time.timeOffset
            break
    }

    if (event.data.taskId) {
        resolveTask(event.data.taskId, event.data.taskResult, event.data.failed)
    }
})

// USE THIS THING ONLY OUTSIDE AND NEVER INSIDE mtproto FOLDER
function resolveTask(taskId, taskResult, failed = false) {
    let resolve: Function = waitingTasks.get(taskId)

    if (resolve) {

        if (failed) {
            resolve = resolve[2]
        } else {
            resolve = resolve[1]
        }

        resolve.apply(resolve[0], [taskResult])
        waitingTasks.delete(taskId)
    } else {
        console.error("BUG: task does not exist")
    }
}

// USE THIS THING ONLY OUTSIDE AND NEVER INSIDE mtproto FOLDER
function performTask(task, data) {
    return new Promise(function (resolve, reject) {
        if (lastTaskId === Number.MAX_VALUE) {
            lastTaskId = 0
        } else {
            lastTaskId++
        }

        waitingTasks.set(lastTaskId, [this, resolve, reject])

        MTProtoWorker.postMessage({
            task: task,
            taskId: lastTaskId,
            taskData: data
        })
    })
}

// USE THIS THING ONLY OUTSIDE AND NEVER INSIDE mtproto FOLDER
class MTProtoBridge {
    TimeManager

    constructor() {
        this.UpdatesManager = UpdatesManager
        this.TimeManager = TimeManager
    }

    connect() {
        return performTask("connect");
    }

    invokeMethod(method, params = {}, dcID = null, isFile = false) {
        return performTask("invokeMethod", {
            method,
            params,
            dcID,
            isFile,
        })
    }

    isUserAuthorized() {
        return !!localStorage.getItem("user")
    }

    getAuthorizedUserId() {
        if (!this.authorizedUserId) {
            this.authorizedUserId = parseInt(localStorage.getItem("user"))
        }

        return this.authorizedUserId
    }

    performWorkerTask(taskName, data) {
        return performTask(taskName, data)
    }

    logout() {
        return this.performWorkerTask("logout").then(() => {
            localStorage.removeItem("user")
        })
    }
}

// USE THIS THING ONLY OUTSIDE AND NEVER INSIDE mtproto FOLDER

export const MTProto = new MTProtoBridge();

// USE THIS THING ONLY OUTSIDE AND NEVER INSIDE mtproto FOLDER

export default MTProto;