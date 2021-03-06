import {RightSidebar} from "../RightSidebar";
import StatefulComponent from "../../../../../V/VRDOM/component/StatefulComponent"
import messages from "../../../../../Api/Telegram/messages"
import VButton from "../../../../Elements/Button/VButton"
import BetterVideoComponent from "../../../Basic/BetterVideoComponent"
import InlineBotManager from "../../../../../Api/Bots/InlineBotManager"
import AppSelectedChat from "../../../../Reactive/SelectedChat"
import FileManager from "../../../../../Api/Files/FileManager";
import Settings from "../../../../../Api/Settings/Settings"
import "./GifSearchSidebar.scss"

export class GifSearchSidebar extends RightSidebar {
	observer: IntersectionObserver

    state = {
        query: "",
        featured: [], //idk how to get them, query "" returns 0 results

        found: [],
        nextOffset: "",

        suggestions: [],

        paused: []
    }

    content() {
        let sets = this.state.query ? this.state.found : this.state.featured;
        let emptyText = this.state.query && !this.loading ? "Nothing found..." : "Loading...";
        return <this.contentWrapper>
            <div class="gif-search">
                <div class="gif-suggestions scrollable-x hide-scroll">
                    {this.state.suggestions.map(emoji => <div class="gif-suggestion rp" onClick={() => {
                        this.fetchGifs(emoji)
                    }}>{emoji}</div>)}
                </div>
                <div class="scrollable" onScroll={this.onScroll}>
                	<div class="gif-grid">
    	                {sets?.map(searchResult => <GifFragment document={searchResult.document} 
    							                	observer={this.observer} 
    							                	paused={this.state.pausedAll || this.state.paused[searchResult.document.id]}
    							                	/>
    					)}
    				</div>
                </div>
                {sets.length === 0 && <div class="nothing">{emptyText}</div>}
            </div>
        </this.contentWrapper>
    }

    componentDidMount() {
    	super.componentDidMount();
    	this.observer = new IntersectionObserver(this.onIntersection, {
            root: this.$el,
            rootMargin: "100px",
            threshold: 0.2,
        });
        Settings.initPromise.then(() => {
            this.setState({
                suggestions: Settings.get("app_config.gif_search_emojies")
            })
        })

    }

    componentDidUpdate() {
        super.componentDidUpdate();
        this.searchInputRef.component.$el.value = this.state.query;
    }

    onScroll = event => {
    	const $element = event.target
        if ($element.scrollHeight - 300 <= $element.clientHeight + $element.scrollTop) {
            this.loadMore();
        }
    }

    loadMore = () => {
    	if(this.loadingMore || this.state.nextOffset === undefined) return; // no next offset

    	this.loadingMore = true;
    	InlineBotManager.searchGifs(AppSelectedChat.current.inputPeer, this.state.query, this.state.nextOffset).then(found => {
    		if(this.state.query === "") {
    			this.setState({
	    			featured: this.state.featured.concat(found.results),
	    			nextOffset: found.next_offset,
	    			pausedAll: false
	    		})
    		} else {
	    		this.setState({
	    			found: this.state.found.concat(found.results),
	    			nextOffset: found.next_offset,
	    			pausedAll: false
	    		})
	    	}
    		this.loadingMore = false;
    	})
    }

    onIntersection = (entries) => {
        entries.forEach(entry => {
            const component = entry.target.__v?.component
            if(!component) return;
            const document = component.props.document
            const id = document.id
            if (entry.isIntersecting) {
                delete this.state.paused[id]
                FileManager.downloadVideo(document)
            } else {
                this.state.paused[id] = true
            }
        })
        this.forceUpdate()
    }

    get searchLazyLevel(): number {
        return 500
    }

    get isSearchAsTitle(): boolean {
        return true
    }

    get leftButtonIcon() {
        return "back"
    }

    onShown(params) {
    	if(this.state.featured.length===0) {
            InlineBotManager.searchGifs(AppSelectedChat.current.inputPeer, "", this.state.nextOffset).then(featured => {
                this.setState({
                    featured: featured.results,
                    nextOffset: featured.next_offset,
                    pausedAll: false
                })
            })
        } else {
        	this.setState({
        		pausedAll: false
        	})
        }
    }

    onHide() {
        this.searchInputRef.component.$el.value = "";
        this.setState({
            query: "",
            found: [],
            nextOffset: "",
            pausedAll: true,
            paused: []
        })
    }

    onSearchInputUpdated = (event) => {
        const q = event.target.value.trim();

        if (q === this.state.query) return;

        this.fetchGifs(q);
    }

    fetchGifs(query) {
        this.loading = true;
        // gifs have patch bugs, better to reset them
        this.setState({
            nextOffset: "",
            found: [],
            query: query,
        })

        InlineBotManager.searchGifs(AppSelectedChat.current.inputPeer, query, this.state.nextOffset).then(found => {
            if (this.state.query !== query) return; //something changed while searching, cancel patch

            this.setState({
            	paused: [], // clear paused in case same gif is found in new query
                found: found.results,
                nextOffset: found.next_offset
            })
            this.searchInputRef.component.$el.value = query
            this.loading = false;
        })
    }
}

const GifFragment = ({document, paused, observer}) => {
	return (
		<div class="gif">
			<BetterVideoComponent document={document}
                                  onClick={() => AppSelectedChat.current.api.sendExistingMedia(document)}
                                  // autoDownload
                                  playsinline
                                  alwaysShowVideo
                                  paused={paused}
                                  observer={observer}
                                  loop
                                  muted
                                  autoplay
                                  />
		</div>
		)
}