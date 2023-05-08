<?php

namespace ClarkWinkelmann\AdvancedSearchHighlight;

use Flarum\Api\Serializer\AbstractSerializer;
use Flarum\Database\AbstractModel;
use Flarum\Foundation\Config;
use Illuminate\Support\Arr;

class HighlightSerializerAttributes
{
    const HTML_TAG_REGEX = '<[^>]+>';

    protected Config $config;

    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    public function __invoke(AbstractSerializer $serializer, AbstractModel $model, array $existingAttributes): array
    {
        $query = Highlighter::highlightForQuery();

        if (!$query) {
            return [];
        }

        $additionalAttributes = [];

        foreach (Highlighter::$attributes as $className => $attributes) {
            if ($model instanceof $className) {
                foreach ($attributes as $attribute => $type) {
                    $value = Arr::get($existingAttributes, $attribute);

                    if ($value) {
                        $htmlReplacementMap = [];

                        if ($type === 'text') {
                            $value = e($value);
                        } else {
                            $replacementIndex = 0;

                            // Remove script and noscript tags including their content to avoid any interference
                            foreach (['script', 'noscript'] as $specialTextBlock) {
                                $value = preg_replace_callback('~<' . $specialTextBlock . '[^>]*>.*?</' . $specialTextBlock . '>~i', function ($matches) use (&$htmlReplacementMap, &$replacementIndex, $specialTextBlock) {
                                    $token = $specialTextBlock . '-' . (++$replacementIndex);

                                    $htmlReplacementMap[$token] = $matches[0];

                                    return '<' . $token . '>';
                                }, $value);
                            }

                            // Remove all HTML tags that contain attributes to avoid the highlighting happening in there
                            $value = preg_replace_callback('~<([a-z0-9-]+)\s[^>]+?>~i', function ($matches) use (&$htmlReplacementMap, &$replacementIndex) {
                                $token = $matches[1] . '-' . (++$replacementIndex);

                                $htmlReplacementMap[$token] = $matches[0];

                                return '<' . $token . '>';
                            }, $value);
                        }

                        $rules = [
                            [$query, null, null],
                            ...Highlighter::$rules,
                        ];

                        foreach ($rules as $rule) {
                            $value = preg_replace_callback('~(' .
                                ($rule[1] === null ? '^|\s' . ($type === 'text' ? '' : '|>') : preg_quote(e($rule[1]), '~')) .
                                ($type === 'text' ? '' : '(?:' . self::HTML_TAG_REGEX . ')?') .
                                ')(' . ($type === 'text' ? preg_quote(e($rule[0]), '~') : implode('(?:' . self::HTML_TAG_REGEX . ')?', array_map(function ($char) {
                                    return preg_quote(e($char), '~');
                                }, str_split($rule[0])))) . ')(?=' .
                                // Use positive lookahead for the "after" part so that it doesn't prevent making another match right on the next word
                                ($type === 'text' ? '' : '(?:' . self::HTML_TAG_REGEX . ')?') .
                                ($rule[2] === null ? '$|\s' . ($type === 'text' ? '' : '|<') : preg_quote(e($rule[2]), '~')) .
                                ')~i', function ($matches) {
                                // If the matching text is cut across multiple HTML tags, close and re-open the mark tag each time
                                // Even if in some situations we could keep a single mark tag across
                                // This way we can do it via a regular expression
                                return $matches[1] . '<mark>' . preg_replace('~(' . self::HTML_TAG_REGEX . ')~', '</mark>$1<mark>', $matches[2]) . '</mark>';
                            }, $value);
                        }

                        // Restore all the content that was removed to avoid being matched by the regex
                        if ($type === 'html') {
                            $value = preg_replace_callback('~<([a-z0-9-]+-[0-9]+)>~i', function ($matches) use ($htmlReplacementMap) {
                                if (Arr::exists($htmlReplacementMap, $matches[1])) {
                                    return $htmlReplacementMap[$matches[1]];
                                }

                                return $matches[0];
                            }, $value);
                        }

                        $additionalAttributes[$attribute . '_highlight_' . $query] = $value;
                    }
                }
            }
        }

        if ($this->config->inDebugMode()) {
            $additionalAttributes['highlighterRulesDebug'] = Highlighter::$rules;
        }

        return $additionalAttributes;
    }
}
