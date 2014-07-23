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
    $                   (   jQuery: jQuery                ): void
    symbol              (   name?: string                 ): BindingJS_API_external
    version:            {   major: number;
                            minor: number;
                            micro: number;
                            date:  number;                }
    bootstrap           (                                 ): void
    shutdown            (                                 ): void
    plugin              (                                 ): string[]
    plugin              (   name: string                  ): boolean
    plugin              (   name: string,
                            callback: (
                                _api: BindingJS_API_internal,
                                $api: BindingJS_API_external,
                                GLOBAL: any
                            ) => void                     ): void
    create              (                                 ): BindingJS_API_binding
    debug               (                                 ): number
    debug               (   level: number                 ): void
    debug               (   level: number,
                            msg:   string                 ): void
}

/*  internal library API (available to plugins only)  */
interface BindingJS_API_internal {
    $                   (                                  ): jQuery
    registerAdapter     (   name: string,
                            spec: BindingJS_SPEC_adapter   ): void
    registerConnector   (   name: string,
                            spec: BindingJS_SPEC_connector ): void
    registerFunction    (   name: string,
                            spec: BindingJS_SPEC_function  ): void
}

/*  internal adapter specification  */
interface BindingJS_SPEC_adapter {
    init?:              (                                 ) => void
    shutdown?:          (                                 ) => void
    observe?:           (                                 ) => number
    unobserve?:         (   id: number                    ) => void
    get?:               (   field: string                 ) => any
    set?:               (   field: string,
                            value: any                    ) => any
}

/*  internal adapter API  */
interface BindingJS_API_adapter {
    scope:              BindingJS_API_scope
    init                (                                 ): void
    shutdown            (                                 ): void
    observe             (                                 ): number
    unobserve           (   id: number                    ): void
    get                 (   field: string                 ): any
    set                 (   field: string,
                            value: any                    ): any
}

/*  internal connector specification  */
interface BindingJS_SPEC_connector {
    init?:              (                                 ) => void
    shutdown?:          (                                 ) => void
    process?:           (   params: Object,
                            values: any[]                 ) => any[]
}

/*  internal connector API  */
interface BindingJS_API_connector {
    scope:              BindingJS_API_scope
    init                (                                 ): void
    shutdown            (                                 ): void
    process             (   params: Object,
                            values: any[]                 ): any[]
}

/*  internal function specification  */
interface BindingJS_SPEC_function {
    init?:              (                                 ) => void
    shutdown?:          (                                 ) => void
    process?:           (   params: Object                ) => any
}

/*  internal function API  */
interface BindingJS_API_function {
    scope:              BindingJS_API_scope
    init                (                                 ): void
    shutdown            (                                 ): void
    process             (   params: Object                ): any
}

/*  external binding API  */
interface BindingJS_API_binding {
    binding             (   dsl: string                   ): BindingJS_API_binding
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
    slot                (   name: string                  ): BindingJS_API_slot
    destroy             (                                 ): void
}

/*  external slot API  */
interface BindingJS_API_slot {
    instances           (                                 ): number
    instance            (   idx: number                   ): HTMLElement
    onInsert            (   cb: (
                                index: number,
                                element: HTMLElement
                            ) => void                     ): BindingJS_API_slot
    onRemove            (   cb: (
                                index: number,
                                element: HTMLElement
                            ) => void                     ): BindingJS_API_slot
}

/*  internal scope API  */
interface BindingJS_API_scope {
    parent                                                 : BindingJS_API_scope
    children                                               : BindingJS_API_scope[]
    template                                               : HTMLElement
    variables                                              : { [key: string]: BindingJS_API_adapter }
    binding                                                : BindingJS_API_chain[]
}

/*  internal binding chain API  */
interface BindingJS_API_chain {
    sourceAdapter                                          : any
    connectors                                             : any[]
    targetAdapter                                          : any
}

