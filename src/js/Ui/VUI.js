/**
 * (c) Telegram V
 */

class VUI {
    static showElement($el) {
        if ($el && $el.classList.contains("hidden")) {
            $el.classList.remove("hidden")
        }
    }

    static hideElement($el) {
        if ($el && !$el.classList.contains("hidden")) {
            $el.classList.add("hidden")
        }
    }
}

export default VUI