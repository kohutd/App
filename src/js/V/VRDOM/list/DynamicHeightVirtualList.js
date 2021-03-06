/*
 * Telegram V
 * Copyright (C) 2020 original authors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import StatefulComponent from "../component/StatefulComponent"
import VComponent from "../component/VComponent";

class DynamicHeightVirtualList extends StatefulComponent {
    containerRef = VComponent.createRef()

    state = {
        start: 0,
        count: 0,
        offsetY: 0,
        totalHeight: null,
    };

    render() {
        const {items, template, itemHeight} = this.props;
        const {start, count, offsetY, totalHeight} = this.state;
        const Template = template

        return (
            <div style={{
                height: `100%`,
                overflow: "auto"
            }} css-will-change="transform" ref={this.containerRef}>

                <div style={{
                    overflow: "hidden",
                    height: `${totalHeight || items.length * itemHeight}px`,
                    position: "relative"
                }} >
                    <div style={{
                        // willChange: "transform",
                        transform: `translateY(${offsetY}px)`
                    }}>
                        {items.slice(start, start + count).map(item => <Template dialog={item}/>)}
                    </div>
                </div>
            </div>
        )
    }

    componentDidMount() {
        this.$el.addEventListener("scroll", this.onScroll)
        this.recalculate()
    }

    componentWillUnmount() {
        this.$el.removeEventListener("scroll", this.onScroll)
    }

    componentDidUpdate() {
        super.componentDidUpdate();
        this.recalculate()
    }

    onScroll = event => {
        this.recalculate()

        if(this.props.onScroll) {
            this.props.onScroll(event)
        }
    }

    recalculate = () => {
        const {items, itemHeight, renderAhread} = this.props;
        const containerHeight = this.containerRef.$el.clientHeight
        const scrollTop = this.$el.scrollTop;

        let start = Math.floor(scrollTop / itemHeight) - renderAhread;
        start = Math.max(0, start);

        let count = Math.ceil(containerHeight / itemHeight) + 2 * renderAhread;
        count = Math.min(items.length - start, count);

        const offsetY = start * itemHeight;

        const totalHeight = items.length * itemHeight;

        this.setState({
            start,
            count,
            offsetY,
            totalHeight
        })

    }
}

DynamicHeightVirtualList.defaultProps = {
    containerHeight: 100,
    renderAhread: 10,
    items: [],
}

export default DynamicHeightVirtualList