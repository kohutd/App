import MessageWrapperFragment from "./MessageWrapperFragment"
import TextWrapperComponent from "./TextWrapperComponent";
import GeneralMessageComponent from "./GeneralMessageComponent"
import {FileAPI} from "../../../../../../../api/fileAPI"

import AudioManager from "../../../../../../audioManager"

class AudioMessageComponent extends GeneralMessageComponent {
    /*
        General component for voice and audio messages

        audio can be obtained from downloadAndPlay

        Required for child components:
        getControls()
        async getMeta()
        setTimerElement(el)
        setProgressElement(el)

        Events:
        controlsMounted()

        You can access other functions to handle your events
    */
	constructor(props) {
		super(props);
		this.message = this.props.message;
		
        let attrs = this.message.raw.media.document.attributes;
        this.duration = 0;
        for(const attr of attrs) {
            if(attr._=="documentAttributeAudio") {
                this.duration = attr.duration
            }
        }

		this.playing = false;

	}

    h() {
        return (
            <MessageWrapperFragment message={this.message}>
                <div class="audio">
                	<progress class="progress-circular"/>
                    <div class="play tgico tgico-play" onMouseDown={this._playButtonClick.bind(this)}/>
                    <div class="audio-wrapper">
                    	{this.getControls()}
                    </div>
                </div>
                <TextWrapperComponent message={this.message}/>
            </MessageWrapperFragment>
        )
    }

    mounted() {
        this.loadProgress = this.$el.querySelector(".progress-circular");
        this.playButton = this.$el.querySelector(".play");
        this.controlsMounted();
    }

    controlsMounted() {
        //override me
    }

    play() {
    	if(this.tryingPlay) return; //I got my audio played twice without this
    	this._setButtonIcon("pause")
        if(!this.audio) {
    		this.downloadAndPlay();
    	} else {
    		this.tryingPlay = true;
	        this.audio.play().then(q=> {
	        	this.tryingPlay = false;
	        	this.playing = true;
	        	AudioManager.set(this);
	        });
    	}
    }

    pause() {
        this._setButtonIcon("play")
        this.audio.pause();
        this.playing = false;
        AudioManager.update();
    }

    async download() {
        this.setLoading(true);
        return FileAPI.getFile(this.message.raw.media.document).then(url => {
            this.audio = new Audio(url);
            this.audio.addEventListener("timeupdate", this._audioTimeUpdate.bind(this));
            this.audio.addEventListener("ended", this._playButtonClick.bind(this));
            this.setLoading(false);
            this._onDownload();
            return this.audio;
        })
    }

    downloadAndPlay() {
    	this._setButtonIcon("close")
    	this.download().then(q=> {
            this.play();
        })
    	
    }

    setLoading(val) {
    	this.loading = !!val;
    	if(this.loading) {
            this.loadProgress.classList.add("visible")
        } else {
            this.loadProgress.classList.remove("visible")
        }
    }

    isLoading() {
    	return this.loading;
    }

    isPlaying() {
        return this.playing;
    }

    async getMeta() {
        return {};
    }

    setTimerElement(elem) {
        this.timer = elem;
    }

    setProgressElement(elem) {
        this.progressEl = elem;
    }

    updatePercent(percent) {
        //nothing, override me
    }

    _onDownload() {
        //override
    }

    _setButtonIcon(icon) {
        let classes = this.playButton.classList;
        classes.remove("tgico-pause");
        classes.remove("tgico-play");
        classes.remove("tgico-close");

        classes.add("tgico-"+icon);
    }

    _audioTimeUpdate() {
        this.timer.textContent = this._timeToFormat(this.audio.currentTime);
        this.updatePercent(this.audio.currentTime / this.audio.duration);
    }

    _timeToFormat(time) {
    	if(!time) return "0:00";
    	time = Math.floor(time);
	    let hours   = Math.floor(time / 3600)
	    let minutes = Math.floor(time / 60) % 60
	    let seconds = time % 60

	    let formatted= [hours,minutes,seconds]
	        .map(v => v < 10 ? "0" + v : v)
	        .filter((v,i) => v !== "00" || i > 0)
	        .join(":");
	    if(formatted.startsWith("0")) formatted = formatted.substr(1);
	    return formatted;
    }

    _handleEnter(e) {
        this.progressEl.addEventListener("mousemove", this._handleMove);
    }

    _handleLeave(e) {
        this.progressEl.removeEventListener("mousemove", this._handleMove);
    }

    _handleMove(e) {
        if(!this.audio) return;
        if (e.buttons === undefined ?
            e.which === 1 :
            e.buttons === 1) {
        	let box = this.progressEl.getBoundingClientRect();
            let percent = (e.pageX - box.x) / box.width;
            this.updatePercent(percent);
            this.audio.currentTime = this.audio.duration * percent;
        }
    }

    _playButtonClick(e) {
        if (this.playing) {
            this.pause();
        } else {
            this.play();
        }
    }

}

export default AudioMessageComponent