import {Vnode, Children} from 'mithril';
import {extend, override} from 'flarum/common/extend';
import app from 'flarum/forum/app';
import DiscussionsSearchSource from 'flarum/forum/components/DiscussionsSearchSource';
import Model from 'flarum/common/Model';
import Discussion from 'flarum/common/models/Discussion';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import CommentPost from 'flarum/forum/components/CommentPost';

function walkVdom(node: Children, callback: (node: Vnode) => void) {
    if (typeof node !== 'object' || node === null) {
        return;
    }

    if (Array.isArray(node)) {
        node.forEach(child => walkVdom(child, callback));
        return;
    }

    callback(node);

    if (Array.isArray(node.children)) {
        walkVdom(node.children, callback)
    }
}

interface NodeInfo {
    node: HTMLElement
    textLength: number
    hasMark: boolean
}

function highlightedResult(model: Model, attribute: string, query: string, length?: number): string | null | undefined {
    const highlightedHtml = model.attribute<string>(attribute + '_highlight_' + query);

    if (!highlightedHtml || !length) {
        return highlightedHtml;
    }

    // Similar to getPlainContent(), we don't want excessive non-text content
    // But unlike Flarum's native solution we are going to preserve most formatting since the backend already went the trouble of highlighting it
    const html = highlightedHtml.replace(/(<\/p>|<br\/?>)/g, '$1 ').replace(/<img\b[^>]*>/gi, ' ');

    const element = new DOMParser().parseFromString(html, 'text/html').documentElement;

    const rootNodes: NodeInfo[] = [];

    let lengthUntilFirstMark = 0;
    let foundFirstMark = false;

    // Just like in Flarum's getPlainContent() we will remove quotes to save space
    // We will also remove script tags but just to make sure they never execute
    // Line breaks will be removed and the nbsp inserted above will take effect
    ['blockquote', 'script', 'br'].forEach(selector => {
        element.querySelectorAll(selector).forEach(node => node.remove());
    });

    // Replace paragraphs with spans to force everything to collapse to one line
    // The nbsp inserted above will ensure some inline spacing remains
    ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(selector => {
        element.querySelectorAll(selector).forEach(blockNode => {
            const span = element.ownerDocument.createElement('span');

            if (selector.indexOf('h') === 0) {
                span.className = 'title-in-excerpt';
            }

            span.innerHTML = blockNode.innerHTML;

            blockNode.parentNode!.replaceChild(span, blockNode);
        });
    });

    element.querySelector('body')!.childNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) {
            return;
        }

        const textLength = node.innerText.length
        const hasMark = node.querySelector('mark') !== null;

        if (!foundFirstMark) {
            if (hasMark) {
                foundFirstMark = true;
            } else {
                lengthUntilFirstMark += textLength;
            }
        }

        rootNodes.push({
            node,
            textLength,
            hasMark,
        });
    });

    // TODO: if there's enough space between the first match and nothing interesting to show later in the string, we should show more of the start just like Flarum's highlight() method does

    let outputtedLength = 0;

    console.log(rootNodes);

    rootNodes.forEach(nodeInfo => {
        // Skip nodes until we find the first with a mark, then we'll count the length from there
        // If the mark was not found above, ignore this step and return content from the first node
        if (outputtedLength === 0 && !nodeInfo.hasMark && foundFirstMark) {
            nodeInfo.node.remove();
            return;
        }

        if (outputtedLength > length) {
            nodeInfo.node.remove();
        }

        outputtedLength += nodeInfo.textLength;
    });

    return element.innerHTML;
}

app.initializers.add('clarkwinkelmann-advanced-search-highlight', () => {
    extend(DiscussionsSearchSource.prototype, 'view', function (dom, query) {
        dom.forEach(node => {
            const index = node && node.attrs && node.attrs['data-index'];

            if (!index || index.indexOf('discussions') !== 0) {
                return;
            }

            const discussion = app.store.getById<Discussion>('discussions', index.replace('discussions', ''));

            if (!discussion) {
                return;
            }

            walkVdom(node, child => {
                const {className} = child.attrs as any || {};

                if (className === 'DiscussionSearchResult-title') {
                    const highlight = highlightedResult(discussion, 'title', query);

                    if (highlight) {
                        child.children = [
                            m.trust(highlight),
                        ];
                    }
                } else if (className === 'DiscussionSearchResult-excerpt') {
                    const mostRelevantPost = discussion.mostRelevantPost();
                    const highlight = mostRelevantPost && highlightedResult(mostRelevantPost, 'contentHtml', query, 100);

                    if (highlight) {
                        child.children = [
                            m.trust(highlight),
                        ];
                    }
                }
            });
        });
    });

    extend(DiscussionListItem.prototype, 'view', function (dom) {
        const {q} = this.attrs.params;

        if (!q) {
            return;
        }

        walkVdom(dom, node => {
            if (node.tag === 'h2' && ((node.attrs as any || {}).className || '').indexOf('DiscussionListItem-title') !== -1) {
                const highlight = highlightedResult(this.attrs.discussion, 'title', q);

                if (highlight) {
                    node.children = [
                        m.trust(highlight),
                    ];
                }
            }
        });
    });

    extend(DiscussionListItem.prototype, 'infoItems', function (items) {
        const {q} = this.attrs.params;

        if (!q || !items.has('excerpt')) {
            return;
        }

        const post = this.attrs.discussion.mostRelevantPost() || this.attrs.discussion.firstPost();

        const highlight = highlightedResult(post, 'contentHtml', q, 175);

        if (highlight) {
            items.setContent('excerpt', m.trust(highlight));
        }
    });

    extend(CommentPost.prototype, 'oninit', function () {
        this.subtree.check(() => app.current.get('stream').highlightPostSearch);
    });

    extend(CommentPost.prototype, 'content', function (dom) {
        const query = app.current.get('stream').highlightPostSearch;

        if (!query) {
            return;
        }

        const contentHtml = highlightedResult(this.attrs.post, 'contentHtml', query);

        if (!contentHtml) {
            return;
        }

        walkVdom(dom, child => {
            if ((child.attrs as any || {}).className === 'Post-body') {
                child.children = [
                    m.trust(contentHtml),
                ];
            }
        });
    });

    override(CommentPost.prototype, 'refreshContent', function (original) {
        const query = app.current.get('stream').highlightPostSearch;

        if (!query) {
            return original();
        }

        const contentHtml = highlightedResult(this.attrs.post, 'contentHtml', query);

        if (!contentHtml) {
            return original();
        }

        // Same as original code, but we repeat it for when the original contentHtml is switched with the highlighted content
        if (this.contentHtml !== contentHtml) {
            this.$('.Post-body script').each(function () {
                const script = document.createElement('script');
                script.textContent = this.textContent;
                Array.from(this.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
                this.parentNode!.replaceChild(script, this);
            });
        }

        this.contentHtml = contentHtml;
    });
});
