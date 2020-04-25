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

import mt_srp_check_password from "../../Cryptography/mt_srp"

function task_mt_srp_check_password({data, success, fail}) {
    try {
        const {g, p, salt1, salt2, srp_id, srp_B, password} = data
        const srp = mt_srp_check_password(g, p, salt1, salt2, srp_id, srp_B, password)

        success(srp)
    } catch (error) {
        fail(error)
    }
}

export default task_mt_srp_check_password