<?php

namespace ClarkWinkelmann\AdvancedSearchHighlight;

use Flarum\Discussion\Discussion;
use Flarum\Post\CommentPost;
use Flarum\User\User;

class Highlighter
{
    /**
     * @internal This API might change without warning
     */
    public static ?string $query = null;
    /**
     * @internal This API might change without warning
     */
    public static array $rules = [];
    /**
     * @internal This API might change without warning
     */
    public static array $attributes = [
        CommentPost::class => [
            'contentHtml' => 'html',
        ],
        Discussion::class => [
            'title' => 'text',
        ],
    ];

    public static function setUserSearchQuery(string $query): void
    {
        self::$query = $query;
    }

    public static function addHighlightRule(string $text, string $before = null, string $after = null): void
    {
        self::$rules[] = [$text, $before, $after];
    }

    public static function highlightForQuery(): ?string
    {
        return self::$query;
    }
}
