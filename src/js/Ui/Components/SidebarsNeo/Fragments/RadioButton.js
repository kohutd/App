import Button from "./Button";
import VRadio from "../../Elements/VRadio";

function RadioButton({checked = false, ...otherArgs}) {
    return <Button left={<VRadio checked={checked}/>} {...otherArgs}/>
}

export default RadioButton