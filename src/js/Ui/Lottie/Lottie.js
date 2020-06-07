// ported from https://github.com/chenqingspring/react-lottie

import StatefulComponent from "../../V/VRDOM/component/StatefulComponent"
import lottie from "../../../../vendor/lottie-web"

class Lottie extends StatefulComponent {
    componentDidMount() {
        const {
            options,
            eventListeners,
        } = this.props;

        const {
            loop,
            autoplay,
            animationData,
            rendererSettings,
            segments,
        } = options;

        this.options = {
            container: this.$el,
            renderer: "canvas",
            loop: loop !== false,
            autoplay: autoplay !== false,
            segments: segments !== false,
            animationData,
            rendererSettings,
        };

        this.options = {...this.options, ...options};

        if (this.props.loadDelay) {
            this.withTimeout(() => {
                this.anim = lottie.loadAnimation(this.options);
                this.anim.setSubframe(false);
                this.registerEvents(eventListeners);
                // this.anim.isPaused = false;
                // this.anim.container.width = this.props.width
                // this.anim.container.height = this.props.height
            }, this.props.loadDelay)
        } else {
            this.anim = lottie.loadAnimation(this.options);
            this.anim.setSubframe(false);
            this.registerEvents(eventListeners);
        }
    }

    componentWillUpdate(nextProps /* , nextState */) {
        /* Recreate the animation handle if the data is changed */
        if (!this.options || this.options.animationData !== nextProps.options.animationData) {
            this.deRegisterEvents(this.props.eventListeners);
            this.destroy();
            this.options = {...this.options, ...nextProps.options};
            this.anim = lottie.loadAnimation(this.options);
            this.anim.setSubframe(false);
            this.registerEvents(nextProps.eventListeners);
        }
    }

    componentDidUpdate() {
        if (this.props.isStopped) {
            this.stop();
        } else if (this.props.segments) {
            this.playSegments();
        } else {
            this.play();
        }

        this.pause();
        this.setSpeed();
        this.setDirection();
    }

    componentWillUnmount() {
        this.deRegisterEvents(this.props.eventListeners);
        this.destroy();
        this.options.animationData = null;
        this.anim = null;
    }

    setSpeed = () => {
        this.anim.setSpeed(this.props.speed);
    }

    setDirection = () => {
        this.anim.setDirection(this.props.direction);
    }

    play = () => {
        this.anim.play();
    }

    playSegments = () => {
        this.anim.playSegments(this.props.segments);
    }

    stop = () => {
        this.anim.stop();
    }

    pause = () => {
        if (this.props.isPaused && !this.anim.isPaused) {
            this.anim.pause();
        } else if (!this.props.isPaused && this.anim.isPaused) {
            this.anim.pause();
        }
    }

    destroy() {
        this.anim.destroy();
    }

    registerEvents = (eventListeners) => {
        eventListeners.forEach((eventListener) => {
            this.anim.addEventListener(eventListener.eventName, eventListener.callback);
        });
    }

    deRegisterEvents = (eventListeners) => {
        eventListeners.forEach((eventListener) => {
            this.anim.removeEventListener(eventListener.eventName, eventListener.callback);
        });
    }

    handleClickToPause = () => {
        // The pause() method is for handling pausing by passing a prop isPaused
        // This method is for handling the ability to pause by clicking on the animation
        if (this.anim.isPaused) {
            this.anim.play();
        } else {
            this.anim.pause();
        }
    }

    render() {
        const {
            width,
            height,
            ariaRole,
            ariaLabel,
            isClickToPauseDisabled,
            onClick,
            title,
        } = this.props;

        const getSize = (initial) => {
            let size;

            if (typeof initial === 'number') {
                size = `${initial}px`;
            } else {
                size = initial || '100%';
            }

            return size;
        };

        const lottieStyles = {
            width: getSize(width),
            height: getSize(height),
            overflow: 'hidden',
            outline: 'none',
            ...this.props.style,
        };

        const onClickHandler = onClick ? onClick : isClickToPauseDisabled ? () => null : this.handleClickToPause;

        return (
            // Bug with eslint rules https://github.com/airbnb/javascript/issues/1374
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions
            <div class={this.props.class}
                 style={lottieStyles}
                 onClick={onClickHandler}
                 title={title}
                 role={ariaRole}
                 aria-label={ariaLabel}
                 tabIndex="0"
                // doNotTouchMyChildren={true}
                 onMouseOver={this.onMouseOver}
                 onMouseOut={this.onMouseOut}
            />
        );
    }

    onMouseOver = e => {
        if (this.props.playOnHover) {
            this.anim.loop = true;
            this.anim.play();
        }
    }

    onMouseOut = e => {
        if (this.props.playOnHover) {
            this.anim.loop = false;
        }
    }
}

Lottie.defaultProps = {
    eventListeners: [],
    isStopped: false,
    isPaused: false,
    speed: 1,
    ariaRole: 'button',
    ariaLabel: 'animation',
    isClickToPauseDisabled: false,
    title: '',
};

export default Lottie;