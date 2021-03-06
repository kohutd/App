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

import TranslatableStatefulComponent from "../../../V/VRDOM/component/TranslatableStatefulComponent"
import loginState from "./LoginState"
import {VInputValidate} from "../../Elements/Input/VInput"
import VComponent from "../../../V/VRDOM/component/VComponent"
import API from "../../../Api/Telegram/API"

class LoginCodeComponent extends TranslatableStatefulComponent {
    globalState = {
        login: loginState,
    };

    state = {
        codeError: null,
        code: "",
    }

    monkeyRef = VComponent.createRef();

    render(props, {codeError, code}, {login}) {
        const {phone} = login;

        const codeType = loginState.sentCode.type;
        let sentCodeText = "We have sent you the code"
        switch(codeType._) {
            case "auth.sentCodeTypeApp":
                sentCodeText = this.l("lng_code_telegram")
            break;
            case "auth.sentCodeTypeSms":
                sentCodeText = this.l("lng_code_desc")
                break;
        }

        return (
            <div className="panel">
                <div id="monkey" css-width="150px" css-height="150px" ref={this.monkeyRef} className="object"/>

                <div className="login-page-header">
                    <span className="login-page-header-title">
                        {phone}
                        <i className="btn-icon rp rps tgico tgico-edit" onClick={this.setPhoneState}/>
                    </span>
                    <span className="login-page-header-subtitle">
                        {sentCodeText}
                    </span>
                </div>

                <form className="login-page-inputs">
                    <VInputValidate label={this.l("lng_code_ph")}
                                    type="number"
                                    inputmode="numeric"
                                    pattern="[0-9]*"
                                    value={code}
                                    filter={this.filterCode}
                                    error={codeError}
                                    onInput={this.onInputCode}/>
                </form>
            </div>
        )
    }

    componentDidMount() {
        loginState.monkey.init(this.monkeyRef.$el);
        loginState.monkey.idle();
    }

    onInputCode = (event: InputEvent) => {
        const code = event.target.value.trim();

        loginState.monkey.monkeyLook(code.length);

        this.setState({
            codeError: "",
            code,
        });

        if (code.length === 5) {
            if (!loginState.sentCode || !loginState.phone) {
                return Promise.reject();
            }

            API.auth.signIn(loginState.phone, loginState.sentCode.phone_code_hash, code).then(Authorization => {
                if (Authorization._ === "auth.authorizationSignUpRequired") {
                    loginState.setRegisterView();
                } else {
                    loginState.authorized(Authorization);
                }

                return Authorization;
            }).catch(error => {
                if (error.type === "SESSION_PASSWORD_NEEDED") {
                    loginState.setPasswordView();
                    return;
                }

                let errorText = error.type;

                switch (error.type) {
                    case "PHONE_CODE_EMPTY":
                        errorText = "The code is empty";
                        break;
                    case "PHONE_CODE_EXPIRED":
                        errorText = "SMS expired";
                        break;
                    case "PHONE_CODE_INVALID":
                        errorText = "Invalid code";
                        break;
                    case "PHONE_NUMBER_INVALID":
                        errorText = "Invalid phone number";
                        break;
                    case "PHONE_NUMBER_UNOCCUPIED":
                        errorText = "The code is valid but no user with the given number is registered";
                        break;
                }

                this.setState({
                    codeError: errorText,
                });
            });
        }
    }

    filterCode = code => {
        return /^[0-9]{0,5}$/.test(code);
    }

    setPhoneState = () => {
        loginState.setPhoneInputView();
    }
}

export default LoginCodeComponent;