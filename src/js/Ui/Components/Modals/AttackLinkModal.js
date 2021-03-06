/*
 * Copyright 2020 Telegram V authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import {ModalHeaderFragment} from "./ModalHeaderFragment";
import VComponent from "../../../V/VRDOM/component/VComponent"
import VUI from "../../VUI"
import StatelessComponent from "../../../V/VRDOM/component/StatelessComponent"
import VInput from "../../Elements/Input/VInput"

export class AttachLinkModal extends StatelessComponent {
    render() {
        return <div className="attach-modal">
            <ModalHeaderFragment title="Create link" close actionText="Create" action={this.create}/>
            <div className="padded bottom">
                <VInput ref="createLinkText" label="Text" value={this.props.text || ""}/>
                <VInput ref="createLinkUrl" label="URL"/>
            </div>
        </div>
    }

    create() {
        const text = VComponent.getComponentById("createLinkText").getValue()
        const url = VComponent.getComponentById("createLinkUrl").getValue()
        this.props.close(text, url)
        VUI.Modal.close()
    }
}