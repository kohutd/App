import Component from "../../../../../../v/vrdom/Component"
import SettingsPane from "../SettingsPane"

export class BackgroundColorComponent extends SettingsPane {
	constructor(props) {
		super(props);

		this.defaultColors = [
			"#E6EBEE",
			"#B2CEE0",
			"#008DD0",
			"#C6E7CB",
			"#C4E1A6",
			"#60B16E",
			"#CCD0AF",
			"#A6A997",
			"#7A7072",
			"#FDD7AF",
			"#FDB76E",
			"#DD8851"
		]
	}

	getId() {
		return "background-color"
	}

	h() {
		return (
			<div class="background-color hidden">
				{this.makeHeader()}
				<div class="pallete">
					Pallete goes here...
				</div>
				<div class="gallery color-list">
					{this.generateColorList()}
				</div>
			</div>
			)
	}

	getName() {
		return "Set a Color"
	}

	generateColorList() {
		let elements = [];
		for(const color of this.defaultColors) {
			elements.push(<ColorSquareFragment color={color} click={this._fragmentClick}/>);
		}
		return elements;
	}

	applyColor(color) {
		window.document.documentElement.style.setProperty("--chat-bg-image", "");
		window.document.documentElement.style.setProperty("--chat-bg-color", color);
	}

	_fragmentClick(ev) {
		this.applyColor(ev.currentTarget.getAttribute("color"));
	}
}

const ColorSquareFragment = ({color, click}) => {
	return(
		<div class="color-square" color={color} onClick={click} style={"background-color:"+color}/>
		)
}