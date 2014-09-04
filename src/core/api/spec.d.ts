/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  external library API symbol  */
declare var BindingJS: BindingJS_API_external;

/*  external library API (available to everyone)  */
interface BindingJS_API_external {
    $                   (                                 ): jQuery
    $                   (   jQuery: jQuery                ): BindingJS_API_external
    symbol              (   name?: string                 ): BindingJS_API_external
    version:            {   major: number;
                            minor: number;
                            micro: number;
                            date:  number;                }
    create              (                                 ): BindingJS_API_binding
    debug               (                                 ): number
    debug               (   level: number                 ): BindingJS_API_external
    debug               (   level: number,
                            msg:   string                 ): BindingJS_API_external
}

/*  internal library API (available to plugins only)  */
interface BindingJS_API_internal {
    registerAdapter     (   name: string,
                            spec: BindingJS_SPEC_model_adapter   ): void
    registerAdapter     (   name: string,
                            spec: BindingJS_SPEC_view_adapter    ): void
    registerConnector   (   name: string,
                            spec: BindingJS_SPEC_connector       ): void
}

/*  internal adapter specification  */
interface BindingJS_SPEC_model_adapter {
    observe?:           (   model: any,
                            path: string[],
                            callback: function            ) => number
    unobserve?:         (   id: number                    ) => void
    getValue            (   model: any,
                            path: string[]                ) => any
    getPaths            (   model: any,
                            path: string[]                ) => string[][]
    set?:               (   model: any,
                            path: string,
                            value: any                    ) => void
    type                (                                 ) => "model"
}

interface BindingJS_SPEC_view_adapter {
    observe?:           (   element: jQuery,
                            path: string[],
                            callback: function            ) => number
    unobserve?:         (   id: number                    ) => void
    getValue            (   element: jQuery,
                            path: string[]                ) => any
    getPaths            (   element: jQuery,
                            path: string[]                ) => string[][]
    set?:               (   element: jQuery,
                            path: string,
                            value: any                    ) => void
    type                (                                 ) => "view"
}

/*  internal connector specification  */
interface BindingJS_SPEC_connector {
    process:           (   input: any                    ) => any
}

/*  external binding API  */
interface BindingJS_API_binding {
    bindingScopePrefix  (                                 ): string
    bindingScopePrefix  (   prefix: string                ): BindingJS_API_binding
    binding             (   dsl: string,
                            id: string?                   ): BindingJS_API_binding
    binding             (   element: HTMLElement          ): BindingJS_API_binding
    template            (   selectorOrHTML: string        ): BindingJS_API_binding
    template            (   element: HTMLElement          ): BindingJS_API_binding
    template            (   fragment: DocumentFragment    ): BindingJS_API_binding
    model               (   model: Object                 ): BindingJS_API_binding
    mount               (   selector: string              ): BindingJS_API_binding
    mount               (   element: HTMLElement          ): BindingJS_API_binding
    mount               (   onMount: (
                                fragment: DocumentFragment
                            ) => void,
                            onUnmount: (
                                fragment: DocumentFragment
                            ) => void                     ): BindingJS_API_binding
    activate            (                                 ): BindingJS_API_binding
    deactivate          (                                 ): BindingJS_API_binding
    pause               (                                 ): BindingJS_API_binding
    resume              (                                 ): BindingJS_API_binding
    // TODO: Rename to socket to be consistent with ontology
    slot                (   name: string                  ): BindingJS_API_slot
    destroy             (                                 ): void
}

/*  external slot API  */
interface BindingJS_API_slot {
    instances           (                                 ): number
    instance            (   idx: number                   ): HTMLElement
    onInsert            (   cb: (
                                keys: string[],
                                element: HTMLElement
                            ) => void                     ): BindingJS_API_slot
    onRemove            (   cb: (
                                keys: string[],
                                element: HTMLElement
                            ) => void                     ): BindingJS_API_slot
}
