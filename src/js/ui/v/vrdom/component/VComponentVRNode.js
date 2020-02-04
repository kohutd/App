import type {VComponentVRNodeProps, VRAttrs, VRSlot} from "../types/types"
import {VComponent} from "./VComponent"

class VComponentVRNode {

    __vrcomponent: boolean = true

    component: VComponent

    attrs: VRAttrs = {}

    slot: VRSlot

    identifier: string | void

    constructor(component: VComponent, props: VComponentVRNodeProps, slot?: VRSlot) {
        this.component = component
        this.attrs = props.attrs
        this.slot = slot
        this.identifier = props.identifier
    }
}

export default VComponentVRNode