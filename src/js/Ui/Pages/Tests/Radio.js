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

import VRadio from "../../Elements/Input/VRadio"
import VCheckbox from "../../Elements/Input/VCheckbox"
import VButton from "../../Elements/Button/VButton"
import {VInputValidate} from "../../Elements/Input/VInput"
import StatefulComponent from "../../../V/VRDOM/component/StatefulComponent"

export default function RadioButtonPage() {
    return (
        <div>
            <RadioTest/>
        </div>
    );
}

class RadioTest extends StatefulComponent {

    state = {
        checked: true
    }

    render({}, {checked}) {
        return (
            <div>
                <VRadio checked={checked} onClick={event => {
                    event.preventDefault();
                }}/>
                <VCheckbox checked={checked} input={event => {
                    event.preventDefault();
                }}/>

                <VInputValidate label="testing"
                                type="text"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                value={123}/>

                <VButton onClick={() => {
                    this.setState({
                        checked: true
                    })
                }}>Checked: true</VButton>
                <VButton onClick={() => {
                    this.setState({
                        checked: false
                    })
                }}>Checked: false</VButton>
                <VButton onClick={() => {
                    this.forceUpdate()
                }}>forceUpdate</VButton>
            </div>
        )
    }
}