# Advanced Search Highlight

[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/clarkwinkelmann/flarum-ext-advanced-search-highlight/blob/master/LICENSE.txt) [![Latest Stable Version](https://img.shields.io/packagist/v/clarkwinkelmann/flarum-ext-advanced-search-highlight.svg)](https://packagist.org/packages/clarkwinkelmann/flarum-ext-advanced-search-highlight) [![Total Downloads](https://img.shields.io/packagist/dt/clarkwinkelmann/flarum-ext-advanced-search-highlight.svg)](https://packagist.org/packages/clarkwinkelmann/flarum-ext-advanced-search-highlight) [![Donate](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.me/clarkwinkelmann)

Highlights search results in HTML post content and partial Meilisearch hits.

If you are using neither [Post Stream Search](https://github.com/clarkwinkelmann/flarum-ext-post-stream-search) nor [Scout Search](https://github.com/clarkwinkelmann/flarum-ext-scout), this extension will barely make any difference.

When using **Post Stream Search**, the filtered post stream will show highlights directly inside of the posts.

When using **Scout Search** with the **Meilisearch** driver, typos and synonyms matches will be highlighted in discussion titles and top post excerpts.
The code specific to Meilisearch is part of the Scout extension.

In all situations, the top post excerpt in the search dropdown and on the discussion search results page will have some of its formatting preserved (bold, italics, and a few other) but will still be mostly collapsed to one or a few lines.

This extension moves search result highlighting to the server-side and provides ways for other extensions to modify the highlight rules.

The post content highlight relies on a few complex regular expressions that might cause some issues with some third-party extensions.
Please report any issue on GitHub.

There are no settings.

## Installation

Requires PHP 7.4+

    composer require clarkwinkelmann/flarum-ext-advanced-search-highlight

## Support

This extension is under **minimal maintenance**.

It was developed for a client and released as open-source for the benefit of the community.
I might publish simple bugfixes or compatibility updates for free.

You can [contact me](https://clarkwinkelmann.com/flarum) to sponsor additional features or updates.

Support is offered on a "best effort" basis through the Flarum community thread.

## Links

- [GitHub](https://github.com/clarkwinkelmann/flarum-ext-advanced-search-highlight)
- [Packagist](https://packagist.org/packages/clarkwinkelmann/flarum-ext-advanced-search-highlight)
