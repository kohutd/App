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

function scrollToAndHighlight($container: HTMLElement, $el: HTMLElement, behavior = "auto") {
	let top = $el.offsetTop;
	if($el.clientHeight < $container.clientHeight) { // try to center message, if it can fit fully in container
		top += $el.clientHeight / 2 -  $container.clientHeight / 2;
	}
    $container.scrollTo({
        top: top,
        behavior,
    })

    $el.classList.add("highlightmessage");

    setTimeout(() => $el.classList.remove("highlightmessage"), 4000);
}

export default scrollToAndHighlight;