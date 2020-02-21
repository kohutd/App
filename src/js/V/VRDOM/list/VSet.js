/*
 * Copyright 2020 Telegram V.
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

import VCollection from "./VCollection"

class VSet extends VCollection {

    prepended: Set
    set: Set

    constructor(items = []) {
        super()

        this.prepended = new Set()
        this.set = new Set(items)
    }

    add(item) {
        this.set.add(item)
        this.mutationSubscribers.forEach(s => s("push", item))
    }

    before(item) {
        this.prepended.add(item)
        this.mutationSubscribers.forEach(s => s("prepend", item))
    }

    clear() {
        this.prepended.clear()
        this.mutationSubscribers.forEach(s => s("clear"))
    }

    delete(item) {
        this.prepended.delete(item)
        this.mutationSubscribers.forEach(s => s("delete", item))
    }

    get items() {
        return [...this.prepended].concat([...this.set])
    }
}

export default VSet