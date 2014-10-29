/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.org>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* 
** Returns a unique jquery selector for $element
** Taken from http://stackoverflow.com/questions/2068272/getting-a-jquery-selector-for-an-element
*/
_api.util.jQuery.getPath = (context, element) => {
    let $current = $api.$()(element)
    let $context = $api.$()(context)
    let path = []
    let realpath = "";
    // Since this code is taken from the web, we limit the number of iterations to
    // avoid hard to track errors
    let iterations = 0
    while (!$current.is($context)) {
        let index = $current.parent().find($current.prop("tagName")).index($current);
        let name = $current.prop("tagName");
        let selector = " " + name + ":eq(" + index + ") ";
        path.push(selector);
        $current = $current.parent();
        
        iterations++
        // Happens if element is not a descendant of
        // context
        _api.util.assume(iterations < 1000)
    }
    while (path.length !== 0) {
        realpath += path.pop();
    }
    return realpath;
}

/*
** Returns the outer HTML as a string of a jQuery element without changing it
*/
_api.util.jQuery.outerHtml = (jQuery) => {
    return $api.$()(jQuery).clone().wrap("<div>").parent().html()
}