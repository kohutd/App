import GeneralMessageComponent from "./Common/GeneralMessageComponent";
import MessageWrapperFragment from "./Common/MessageWrapperFragment";
import TextWrapperFragment from "./Common/TextWrapperFragment";
import AvatarComponent from "../../../Basic/AvatarComponent";
import VRadio from "../../../../Elements/Input/VRadio";
import VCheckbox from "../../../../Elements/Input/VCheckbox";
import messages from "../../../../../Api/Telegram/messages";
import UIEvents from "../../../../EventBus/UIEvents";
import PeersStore from "../../../../../Api/Store/PeersStore";
import {parseMessageEntities} from "../../../../../Utils/htmlHelpers";
import VComponent from "../../../../../V/VRDOM/component/VComponent";
import VSpinner from "../../../../Elements/VSpinner";
import {formatTime} from "../../../../../Utils/date";
import Locale from "../../../../../Api/Localization/Locale";

export default class PollMessageComponent extends GeneralMessageComponent {

    state = {
        showingSolution: false,
        answers: []
    };

    footerRef = VComponent.createFragmentRef();
    timerRef = VComponent.createFragmentRef();

    makeContextMenu = () => {
        let message = this.props.message;
        const contextActions = [];
        if (!message.isQuiz && message.isVoted && !message.poll.closed) {
            contextActions.push({
                icon: "revote",
                title: this.l("lng_polls_retract"),
                onClick: _ => this.cancelVote()
            });
        }

        if (message.isOut && !message.poll.closed) {
            contextActions.push({
                icon: "close",
                title: this.l("lng_polls_stop"),
                onClick: _ => this.closePoll()
            });
        }
        return contextActions;
    };

    reactive(R) {
        R.object(this.props.message)
            .on("pollEdit", this.onPollChange)
            .on("pollVote", this.onPollChange);
    }

    componentDidMount() {
        if (this.props.message.poll.close_date && !this.props.message.isVoted) this.withInterval(this.updateTimer, 500);
    }

    componentDidUpdate() {
        this.clearIntervals();
        if (this.props.message.poll.close_date && !this.props.message.isVoted) this.withInterval(this.updateTimer, 500);
    }

    render({message, showDate}) {
        let classes = {
            "poll": true,
            "voted": message.isVoted
        };

        return (
            MessageWrapperFragment(
                {message, showDate, contextActions: this.makeContextMenu()},
                <>
                    <div className={classes}>
                        <div className="question">{message.poll.question}</div>
                        <div className="subtitle">
                            <div className="poll-type">{this.l(message.pollTypeKey)}</div>
                            {message.poll.public_voters &&
                            <RecentVotersFragment recentVoters={message.results.recent_voters}/>}
                            <div className="filler"/>
                            {this.shouldShowTooltip() && <TipFragment click={_ => this.showSolution()}/>}
                            {(message.poll.close_period && !message.isVoted) &&
                            <TimerFragment ref={this.timerRef} left={0} total={0}/>}
                        </div>
                        {this.makeAnswerBlock()}
                        <FooterFragment message={message} actionClick={this.onActionClick}
                                        answers={this.state.answers}/>
                    </div>

                    {TextWrapperFragment({message})}
                </>
            )
        );
    }

    sendVote = () => {
        let message = this.props.message;
        if (this.state.answers.length == 0) return;
        messages.sendVote(message, this.state.answers).then(response => {
            if (!message.isVotedCorrectly) {
                this.showSolution();
            } else {
                UIEvents.General.fire("confetti.show");
            }
            this.setState({
                answers: []
            });
        });
    };

    showSolution = () => {
        if (this.props.message.results?.solution && !this.state.showingSolution) {
            UIEvents.General.fire("snackbar.show", {
                text: <SnackbarSolutionFragment message={this.props.message}/>,
                time: 5
            });
            this.setState({
                showingSolution: true
            });

            this.withTimeout(_ => {
                this.setState({showingSolution: false});
            }, 5000);
        }
    };

    addAnswer = (option) => {
        if (!option && option !== 0) return; //idk if this byte can be 0, but better be prepared
        this.state.answers.push(Number.parseInt(option));
        this.forceUpdate();
        if (!this.props.message.isMultiple) this.sendVote();
    };

    cancelAnswer = (option) => {
        if (!option && option !== 0) return;
        option = Number.parseInt(option);
        this.setState({
            answers: this.state.answers.filter(item => (item !== option))
        });
    };

    onPollChange = () => {
        this.forceUpdate();
        UIEvents.General.fire("pollUpdate", {message: this.props.message}); //update sidebar

        this.withTimeout(_ => this.forceUpdate(), 1000); // текст з обраного варіанту кудись зникає, дикий костиль, ДАВИД ФІКС!
    };

    onActionClick = (event) => {
        if (event.currentTarget.classList.contains("disabled")) return;
        if (!this.props.message.isVoted) {
            this.sendVote(); // Vote
        } else {
            this.showFullResults(); // Results
        }
    };

    makeAnswerBlock = () => {
        let answers = [];
        for (const answer of this.props.message.poll.answers) {
            answers.push(<AnswerFragment message={this.props.message} option={answer.option[0]}
                                         click={this.onAnswerClick}
                                         chosen={this.state.answers.includes(answer.option[0])}/>);
        }
        return answers;
    };

    onAnswerClick = (event) => {
        let option = event.currentTarget.getAttribute("option");
        let elem = event.currentTarget.querySelector("input[type=radio],input[type=checkbox]");
        elem.checked = !elem.checked;
        if (elem.checked) {
            this.addAnswer(option);
        } else {
            this.cancelAnswer(option);
        }
    };

    updateTimer = () => {
        let message = this.props.message;
        let left = message.poll.close_date - Date.now() / 1000;
        if (left < 0) {
            this.clearIntervals();
            this.withTimeout(_ => messages.getPollResults(message), 1000);
        }
        this.timerRef.update({
            left: left,
            total: message.poll.close_period
        });
    };

    shouldShowTooltip = () => {
        let message = this.props.message;
        return message.isQuiz &&
            (message.poll.closed || message.isVoted) &&
            !this.state.showingSolution &&
            this.props.message.results?.solution;
    };

    cancelVote = () => {
        messages.sendVote(this.props.message, []);
    };

    closePoll = () => {
        messages.closePoll(this.props.message);
    };

    showFullResults = () => {
        UIEvents.General.fire("poll.showResults", {pollMessage: this.props.message});
    };
}

const AnswerFragment = ({message, option, chosen, click}) => {
    let answer = message.poll.answers.find(answ => answ.option[0] === option);
    let result = message.results?.results?.find(res => res.option[0] === option);

    if (!message.isVoted && !message.poll.closed) {
        return (
            <div class="answer voting rp" option={answer.option} onClick={click}>
                <div class="vote">{message.isMultiple ? <VCheckbox checked={chosen}/> :
                    <VRadio checked={chosen}/>}</div>
                <div class="answer-text">{answer.text}</div>
            </div>
        );
    } else {
        let relPercent = Math.max(message.calculateRelativePercent(result), 1); //0% doesn't show a bar
        let absPercent = message.calculateAbsolutePercent(result);
        if (absPercent === null) return undefined;

        let votedClass = {
            "tgico": true,
            "tgico-check": result.chosen || (message.isQuiz && result.correct),
            "tgico-close": (message.isQuiz && !result.correct)
        };

        let answerClasses = {
            answer: true,
            wrong: message.isQuiz && !result.correct && !message.isVotedCorrectly && result.chosen,
            right: message.isQuiz && result.correct,
            chosen: result.chosen
        };

        return (
            <div class={answerClasses} option={answer.option}>
                <div class="percent">{absPercent + "%"}</div>
                <div class="voted"><span class={votedClass}/></div>
                <div class="answer-text">{answer.text}</div>
                <div class="progress-wrapper">
                    <div class="progress" css-width={relPercent + "%"}></div>
                </div>
            </div>
        );
    }
};

const FooterFragment = ({message, actionClick, answers}) => {
    if (message.isVoted && message.isPublic) {
        return <div class="action-button" onClick={actionClick}>{Locale.l("lng_polls_view_results")}</div>;
    } else if (!message.isVoted && message.isMultiple) {
        const classes = {
            "action-button": true,
            disabled: answers.length === 0,
            rp: answers.length === 0
        };
        return <div class={classes} onClick={actionClick}>{Locale.l("lng_polls_submit_votes")}</div>;
    }

    let voted = "";
    if (message.isQuiz) {
        if (message.results.total_voters > 0) {
            voted = Locale.lp("lng_polls_answers_count", message.results.total_voters, {
                count: message.results.total_voters
            });
        } else {
            Locale.l("lng_polls_answers_none");
        }
    } else {
        if (message.results.total_voters > 0) {
            voted = Locale.lp("lng_polls_votes_count", message.results.total_voters, {
                count: message.results.total_voters
            });
        } else {
            Locale.l("lng_polls_votes_none");
        }
    }

    return <div class="stats">{voted}</div>;
};

const TipFragment = ({click}) => {
    return (
        <div class="tip" onClick={click}>
            <i class="tgico tgico-tip"/>
        </div>
    );
};

const RecentVotersFragment = ({recentVoters}) => {
    let avatars = [];
    for (let id of recentVoters) {
        let user = PeersStore.get("user", id);
        avatars.push(<AvatarComponent noSaved peer={user}/>);
    }
    return (
        <div class="recent-voters">
            {avatars}
        </div>
    );
};

const SnackbarSolutionFragment = ({message}) => {
    let text = parseMessageEntities(message.results.solution, message.results.solution_entities);
    return (
        <div class="solution">
            <i class="tgico tgico-info2"/>
            <div class="text">
                {text}
            </div>
        </div>
    );
};

const TimerFragment = ({left, total}) => {
    if (total === 0) return <div class="timer"/>;
    if (left < 0) left = 0;
    let percent = left / total;
    left = Math.floor(left);
    let formatted = formatTime(left);
    let color;
    if (left < 6) color = "#DF3F40";
    return (
        <div class="timer">
            <span class="time-left" css-color={color}>{formatted}</span>
            <VSpinner progress={percent} determinate={true} color={color}/>
        </div>
    );
};