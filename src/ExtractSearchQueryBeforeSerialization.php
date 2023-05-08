<?php

namespace ClarkWinkelmann\AdvancedSearchHighlight;

use Flarum\Api\Controller\AbstractSerializeController;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Parameters;

class ExtractSearchQueryBeforeSerialization
{
    public function __invoke(AbstractSerializeController $controller, $data, ServerRequestInterface $request)
    {
        $parameters = new Parameters($request->getQueryParams());

        $filters = $parameters->getFilter() ?? [];

        if (Arr::exists($filters, 'q')) {
            Highlighter::setUserSearchQuery((string)Arr::get($filters, 'q'));
        }
    }
}
