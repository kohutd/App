import VSpinner from "../../Elements/VSpinner";
import StatefulComponent from "../../../V/VRDOM/component/StatefulComponent"

class TestDeterminateSpinner extends StatefulComponent {
    state = {
        progress: 0
    }

    render() {
        return <div>
            <VSpinner determinate big background progress={this.state.progress}>
                {Math.round(this.state.progress * 100)}%
            </VSpinner>
        </div>
    }

    componentDidMount() {
        this.withInterval(() => {
            let progress = this.state.progress + 0.01

            if (progress >= 1) {
                progress = 0
            }

            // console.log(progress)

            this.setState({
                progress
            })
        }, 100)
    }
}

class TestDocument extends StatefulComponent {
    state = {
        progress: 0
    }

    render() {
        return <div>
            <VSpinner determinate big background progress={this.state.progress}>
                {Math.round(this.state.progress * 100)}%
            </VSpinner>
        </div>
    }

    componentDidMount() {
        this.withInterval(() => {
            let progress = this.state.progress + 0.01

            if (progress >= 1) {
                progress = 0
            }

            // console.log(progress)

            this.setState({
                progress
            })
        }, 100)
    }
}

export function SpinnerTestPage() {
    const ls = [...Array(4)].map((_, i) => <VSpinner white big progress={0.1} background>
        LOL
    </VSpinner>)
    // const ls = [...Array(200)].map((_, i) => <progress className="progress-circular big"></progress>)
    return (
        <div>
            <TestDeterminateSpinner/>
            {/*<div*/}
            {/*    css-background-image={"url(https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_960_720.jpg)"}*/}
            {/*    css-height="100vh" css-filter="blur(5px)" css-position="absolute"*/}
            {/*    css-width="100vw" css-left="0" css-top="0"></div>*/}
            {/*<TestDeterminateSpinner/>*/}
            {/*<div css-display="flex" css-flex-wrap="wrap">*/}
            {/*    {ls}*/}
            {/*</div>*/}
        </div>
    )
}