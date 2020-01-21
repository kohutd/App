import L from "../../../../../../common/locale/localization"

const ServiceMessageComponent = ({message}) => {
	let msg = textByAction(message);
    return (
        <div className="service">
            <div className="service-msg">{msg}</div>
        </div>
    )
}

function textByAction(message) {
	console.log(message);
	let action = message.action;
	let msg=action._;
	if(msg == "messageActionPinMessage") {
			/*
				TODO: get replied message, test for media or text, select needed data
			*/
			let user = message.from.name;
			let text = "TODO"
			return L("lng_action_pinned_message", {from: user, text: text})
	}
	return msg;
}

export default ServiceMessageComponent