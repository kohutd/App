import Component from "../../../../v/vrdom/Component";

export default class PaneComponent extends Component {
    constructor(props) {
        super(props)
    }

    set isShown(value) {
        this.state.isShown = value
        this.__patch()
    }
}