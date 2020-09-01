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

/**
 * @param {function|*} value
 * @return {*}
 */
export const callOrReturn = (value: any): any => {
    if (typeof value === "function") {
        return value();
    } else {
        return value;
    }
}

export const throttle = (callable, period: number, context = null) => {
    let timeoutId;
    let time;

    return function () {
        if (!context) {
            context = this
        }

        if (time) {
            clearTimeout(timeoutId);

            timeoutId = setTimeout(() => {
                if ((Date.now() - time) >= period) {
                    callable.apply(context, arguments);

                    time = Date.now();
                }
            }, period - (Date.now() - time));
        } else {
            callable.apply(context, arguments);

            time = Date.now();
        }
    }
}

export const throttleWithRAF = callable => {
    return throttleWith(fastRaf, callable);

    let waiting = false;

    return () => {
        if (!waiting) {
            waiting = true;

            requestAnimationFrame(() => {
                waiting = false;
                callable(...arguments);
            });
        }
    };
};

export function throttleWith(schedulerFn, fn) {
    let waiting = false;
    let args;

    return (..._args) => {
        args = _args;

        if (!waiting) {
            waiting = true;

            schedulerFn(() => {
                waiting = false;
                fn(...args);
            });
        }
    };
}

let fastRafCallbacks;

export function fastRaf(callback) {
    if (!fastRafCallbacks) {
        fastRafCallbacks = [callback];

        requestAnimationFrame(() => {
            const currentCallbacks = fastRafCallbacks;
            fastRafCallbacks = undefined;
            currentCallbacks.forEach((cb) => cb());
        });
    } else {
        fastRafCallbacks.push(callback);
    }
}

export const debounce = (callable, delay: number, context = null) => {
    let timeoutId;

    return function () {
        if (!context) {
            context = this;
        }

        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => callable.apply(context, arguments), delay);
    }
}