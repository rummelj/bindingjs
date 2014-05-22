/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  create namespace  */
_api.dom = {}

/*  convert an XML string into a DOM document  */
_api.dom.xml2doc = (xml) => {
    let doc
    /* global $: true */
    /* global document: true */

    /*  attempt 1: the portable jQuery way  */
    if (typeof $.parseXML === "function")
        doc = $.parseXML(xml)

    /*  attempt 2: the modern W3C way  */
    else if (typeof window.DOMParser !== "undefined") {
        let parser = new window.DOMParser()
        doc = parser.parseFromString(xml, "text/xml")
    }

    /*  attempt 3: the ancient Microsoft way  */
    else if (typeof window.ActiveXObject !== "undefined") {
        doc = new window.ActiveXObject("Microsoft.XMLDOM")
        doc.async = false
        doc.loadXML(xml)
    }

    /*  else we have to give up...  */
    else 
        throw new Error("no XML parser found")

    return doc
}

/*  convert a HTML string into a DOM fragment  */
_api.dom.html2dom = (html) => {
    /*  the necessary (= valid) inner wrapper elements  */
    let wrapMap = {
        option:   [ 1, "<select multiple='multiple'>", "</select>" ],
        legend:   [ 1, "<fieldset>", "</fieldset>" ],
        area:     [ 1, "<map>", "</map>" ],
        param:    [ 1, "<object>", "</object>" ],
        thead:    [ 1, "<table>", "</table>" ],
        tr:       [ 2, "<table><tbody>", "</tbody></table>" ],
        col:      [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
        td:       [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
        body:     [ 0, "", "" ],
        _default: [ 1, "<div>", "</div>" ]
    }
    wrapMap.optgroup = wrapMap.option
    wrapMap.tbody    = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead
    wrapMap.th       = wrapMap.td

    /*  create an outer wrapper element  */
    let element = document.createElement("div")
    let match = /<\s*\w.*?>/g.exec(html)
    if (match !== null) {
        /*  regular HTML element  */
        let tag = match[0].replace(/</g, "").replace(/>/g, "").split(" ")[0]
        let map = wrapMap[tag] || wrapMap._default
        html = map[1] + html + map[2]
        element.innerHTML = html
        let j = map[0] + 1
        while (j--)
            element = element.lastChild
    } 
    else {
        /*  non-HTML elements  */
        element.innerHTML = html
        element = element.lastChild
    }
    return element
}

