import StatelessComponent from "./StatelessComponent"
import UIEvents from "../../../Ui/EventBus/UIEvents"
import Locale from "../../../Api/Localization/Locale"

class TranslatableStatelessComponent<P> extends StatelessComponent<P> {

	// ALWAYS CALL SUPER!!!
	appEvents(E) {
		E.bus(UIEvents.General)
		.updateOn("language.changed")
		.updateOn("language.ready")
	}

	l(key, replaces) {
		return Locale.l(key, replaces);
	}

	lp(key, count, replaces) {
		return Locale.lp(key, count, replaces);
	}
}

export default TranslatableStatelessComponent;