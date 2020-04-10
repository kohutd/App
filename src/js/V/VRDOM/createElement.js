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

import type {VRNodeProps, VRTagName} from "./types/types"
import VRNode from "./VRNode"
import VComponentVRNode from "./component/VComponentVRNode"
import VListVRNode from "./list/VListVRNode"
import vrdom_isTagNameList from "./is/isTagNameList"
import vrdom_isTagNameComponent from "./is/isTagNameComponent"

/**
 * Creates VRNode
 *
 * @param tagName
 *
 * @param props
 */
function vrdom_createElement(tagName: VRTagName, props: VRNodeProps): VRNode | VComponentVRNode {
    if (typeof tagName === "function") {

        if (vrdom_isTagNameComponent(tagName)) {

            // console.debug("[createElement] creating component node", tagName.prototype.constructor.name)

            return new VComponentVRNode(tagName, {
                attrs: props.attrs,
                ref: props.ref
            }, props.children)

        } else if (vrdom_isTagNameList(tagName)) {

            // console.debug("[createElement] creating list node")

            return new VListVRNode(tagName, props.attrs)

        } else {

            if (props.ref && props.ref.__fragment_ref) {
                props.ref.slot = props.children.length > 0 ? props.children : undefined
                props.ref.props = props.attrs

                if (props.ref.fragment) {

                    return props.ref.fragment({...props.attrs, slot: props.children})

                } else {

                    props.ref.fragment = tagName

                    const node = tagName({...props.attrs, slot: props.children})
                    node.ref = props.ref

                    return node

                }
            } else {

                return tagName({
                    ...props.attrs,
                    slot: props.children
                })

            }

        }
    }

    return new VRNode(tagName, props)
}

export default vrdom_createElement