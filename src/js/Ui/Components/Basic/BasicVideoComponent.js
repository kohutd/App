/*
 * Telegram V
 * Copyright (C) 2020 original authors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import AppEvents from "../../../Api/EventBus/AppEvents"
import StatefulComponent from "../../../V/VRDOM/component/StatefulComponent"
import VComponent from "../../../V/VRDOM/component/VComponent"

import MP4Box from "mp4box"
import FileManager from "../../../Api/Files/FileManager"
import DocumentParser from "../../../Api/Files/DocumentParser"

class BasicVideoComponent extends StatefulComponent {
    state = {
        url: "",
        bufferOffset: 0,
    };

    videoRef: { $el: HTMLVideoElement } = VComponent.createRef();

    mediaSource: MediaSource;
    mp4box: ISOFile;

    queues: Map<SourceBuffer, Array<Uint8Array>> = new Map();

    appEvents(E) {
        E.bus(AppEvents.Files)
            .filter(event => event.file.id === this.props.document.id)
            .on("download.done", this.onDownloadDone)
            .on("download.newPart", this.onDownloadNewPart);
    }

    render({document}, {url}) {
        return (
            <video css-max-width="500px"
                   ref={this.videoRef}
                   src={url}
                   autoPlay
                   controls/>
        );
    }

    componentWillMount({document}) {
        this.mediaSource = new MediaSource();
        this.state.url = URL.createObjectURL(this.mediaSource);

        this.videoInfo = DocumentParser.attributeVideo(document);

        this.mediaSource.onsourceopen = () => {
            this.mp4box = MP4Box.createFile();

            this.mp4box.onSegment = (id, sourceBuffer, buffer, sampleNum, is_last) => {
                sourceBuffer.segmentIndex++;
                sourceBuffer.pendingAppends.push({id, buffer, sampleNum, is_last});

                console.warn("Application", "Received new segment for track " + id + " up to sample #" + sampleNum + ", segments pending append: " + sourceBuffer.pendingAppends.length);

                this.onUpdateEnd(sourceBuffer, true, false);
            }

            this.mp4box.onReady = info => {
                this.mediaSource.duration = this.videoInfo.duration;

                info.tracks.forEach(this.initTrack);

                const initSegments = this.mp4box.initializeSegmentation();
                initSegments.forEach(this.initSegment);

                this.mp4box.start();
            }

            FileManager.downloadDocument(document);
        }
    }

    initTrack = track => {
        const mime = `${this.props.document.mime_type}; codecs="${track.codec}"`;
        const sourceBuffer = this.mediaSource.addSourceBuffer(mime);
        sourceBuffer.id = track.id;

        this.mp4box.setSegmentOptions(track.id, sourceBuffer, {nbSamples: 100});

        sourceBuffer.pendingAppends = [];
    }

    initSegment = segment => {
        const {id, user: sourceBuffer, buffer} = segment;

        sourceBuffer.addEventListener("updateend", this.onInitAppended);
        sourceBuffer.appendBuffer(buffer);

        sourceBuffer.segmentIndex = 0;
    }

    onInitAppended = event => {
        const sourceBuffer = event.target;

        if (this.mediaSource.readyState === "open") {
            sourceBuffer.sampleNum = 0;
            sourceBuffer.removeEventListener("updateend", this.onInitAppended);
            sourceBuffer.addEventListener("updateend", () => this.onUpdateEnd(sourceBuffer, true, true));

            this.onUpdateEnd(sourceBuffer, false, true);
        }
    }

    onUpdateEnd = (sourceBuffer, isNotInit, isEndOfAppend) => {
        if (isEndOfAppend === true) {
            if (isNotInit === true) {
                console.log(sourceBuffer, "Update ended");
            }

            if (sourceBuffer.sampleNum) {
                this.mp4box.releaseUsedSamples(sourceBuffer.id, sourceBuffer.sampleNum);
                delete sourceBuffer.sampleNum;
            }

            if (sourceBuffer.is_last) {
                this.mediaSource.endOfStream();
            }
        }

        console.log("onUpdateEnd")

        if (this.mediaSource.readyState === "open" && !sourceBuffer.updating && sourceBuffer.pendingAppends.length > 0) {
            const part = sourceBuffer.pendingAppends.shift();

            sourceBuffer.sampleNum = part.sampleNum;
            sourceBuffer.is_last = part.is_last;
            sourceBuffer.appendBuffer(part.buffer);
        }
    }

    onDownloadNewPart = ({newBytes, totalBytes}) => {
        console.warn("STREAMING: appendBuffer");

        const part = newBytes.buffer;
        part.fileStart = this.state.bufferOffset;

        this.mp4box.appendBuffer(part);

        this.state.bufferOffset += part.byteLength;
    }

    onDownloadDone = ({blob, url}) => {
        blob.arrayBuffer().then(buff => {
            const lastPart = buff.slice(this.state.bufferOffset);
            lastPart.fileStart = this.state.bufferOffset;
            this.mp4box.appendBuffer(lastPart, true);
            this.mp4box.flush();
        });
        console.warn("STREAMING: done")
    }
}


// componentDidMount() {
//     FileManager.downloadDocument(this.props.document);
// }
//
// componentWillUpdate(nextProps, nextState) {
//     if (nextProps.document.id !== this.props.document.id) {
//         FileManager.downloadDocument(this.props.document);
//     }
// }
//
// shouldComponentUpdate(nextProps, nextState) {
//     if (nextProps.document.id !== this.props.document.id) {
//         return true;
//     }
// }

export default BasicVideoComponent;