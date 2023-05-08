<?php

namespace ClarkWinkelmann\AdvancedSearchHighlight;

use Flarum\Api\Controller\AbstractSerializeController;
use Flarum\Api\Serializer\DiscussionSerializer;
use Flarum\Api\Serializer\PostSerializer;
use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/less/forum.less'),

    (new Extend\ApiController(AbstractSerializeController::class))
        ->prepareDataForSerialization(ExtractSearchQueryBeforeSerialization::class),

    (new Extend\ApiSerializer(DiscussionSerializer::class))
        ->attributes(HighlightSerializerAttributes::class),
    (new Extend\ApiSerializer(PostSerializer::class))
        ->attributes(HighlightSerializerAttributes::class),
];
