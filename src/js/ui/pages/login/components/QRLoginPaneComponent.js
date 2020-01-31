import PaneComponent from "./common/PaneComponent"
import InfoComponent from "./common/infoComponent"

import AppConfiguration from "../../../../configuration";
import {MTProto} from "../../../../mtproto/external"
import UpdatesManager from "../../../../api/updates/updatesManager";
import {tsNow} from "../../../../mtproto/timeManager";

const QRCodeStyling = require("qr-code-styling")

export default class QRLoginPaneComponent extends PaneComponent {
    constructor(props) {
        super(props);
        MTProto.UpdatesManager.subscribe("updateLoginToken", l => {
            if(l._ === "auth.loginTokenSuccess") {
                this.props.finished(l.authorization)
                return
            }
            this.open();
            /*MTProto.invokeMethod("auth.exportLoginToken", {
                api_id: AppConfiguration.mtproto.api.api_id,
                api_hash: AppConfiguration.mtproto.api.api_hash,
                except_ids: []
            }).then(l => {
                this.open(l)
            })*/
        })
    }

    h() {
        let classList = ["fading-block"]
        if (this.state.isShown === true) {
            classList.push("fade-in");
        } else if (this.state.isShown === false) {
            classList.push("fade-out");
        } else {
            classList.push("hidden");
        }
        return (
            <div className={classList.join(" ")}>
                <div className="object big">
                    <span>Generating QR-code...</span>
                </div>
                <InfoComponent header="Scan from mobile Telegram"
                               description={<ol>
                                   <li>Open Telegram on your phone</li>
                                   <li>Go to Settings -> Devices -> Scan QR Code</li>
                                   <li>Scan this image to Log In</li>
                               </ol>}/>
                <div className="qr-login-button" onClick={this.props.backToPhone}>Or log in using your phone number</div>


            </div>
        )
    }



    open() {
        // TODO recreate QR when expired
        // TODO multiple DCs
        this.requestLoginToken().then(l => {
            if(l._ === "auth.loginTokenSuccess") { //idk where it goes, Maks, fix pls
                this.props.finished(l.authorization)
                return
            }
            const b64encoded = btoa(String.fromCharCode.apply(null, l.token)).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '')
            const string = "tg://login?token=" + b64encoded
            const obj = this.$el.querySelector(".object")

            if(obj.firstChild) obj.removeChild(obj.firstChild);
            let qr = this.makeQR(string);
            obj.appendChild(qr)

            setTimeout(this.open, 1000 * (l.expires - tsNow(true)));
        }).catch(reject => {
            if(reject.reason == "authorized") return; //ignore
        })
    }

    /**
        Returns Promise
    **/
    requestLoginToken() {
        return new Promise(async (resolve, reject) => {
            if(MTProto.isUserAuthorized()) {
                reject({reason: "authorized"});
                return;
            }

            let l = await MTProto.invokeMethod("auth.exportLoginToken", {
                api_id: AppConfiguration.mtproto.api.api_id,
                api_hash: AppConfiguration.mtproto.api.api_hash,
                except_ids: []
            })
            resolve(l);
        })
    }

    /**
        Returns canvas element to insert
    **/
    makeQR(data) {
        return new QRCodeStyling({
            width: 240,
            height: 240,
            data: data,
            image: "./static/images/logo.svg",
            dotsOptions: {
                color: "#000000",
                type: "rounded"
            },
            imageOptions: {
                imageSize: 0.5
            },
            backgroundOptions: {
                color: "#ffffff",
            },
            qrOptions: {
                errorCorrectionLevel: "L"
            }
        })._canvas._canvas;
    }
}