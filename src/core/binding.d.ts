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
}

/*  internal library API (available to plugins only)  */
interface BindingJS_API_internal {
    registerAdapter     (   name: string,
                            spec: BindingJS_API_adapter   ): void
    registerConnector   (   name: string,
                            spec: BindingJS_API_connector ): void
    registerFunction    (   name: string,
                            spec: BindingJS_API_function  ): void
}

/*  internal adapter API  */
interface BindingJS_API_adapter {
    init                (                                 ): void
    shutdown            (                                 ): void
    observe             (                                 ): number
    unobserve           (   id: number                    ): void
    get                 (   field: string                 ): any
    set                 (   field: string,
                            value: any                    ): any
}

/*  internal connector API  */
interface BindingJS_API_connector {
    init                (                                 ): void
    shutdown            (                                 ): void
    process             (   args: any[]                   ): any[]
}

/*  internal function API  */
interface BindingJS_API_function {
    init                (                                 ): void
    shutdown            (                                 ): void
    process             (   args: any[]                   ): any
}

/*  external binding API  */
interface BindingJS_API_binding {
    destroy             (                                 ): void
    binding             (   dsl: string                   ): BindingJS_API_binding
    template            (   selector: string              ): BindingJS_API_binding
    template            (   element: HTMLElement          ): BindingJS_API_binding
    template            (   fragment: DocumentFragment    ): BindingJS_API_binding
    model               (   model: Object                 ): BindingJS_API_binding
    mounting            (   selector: string              ): BindingJS_API_binding
    mounting            (   element: HTMLElement          ): BindingJS_API_binding
    mounting            (   cb: (
                                fragment: DocumentFragment
                            ) => void                     ): BindingJS_API_binding
    slot                (   name: string                  ): BindingJS_API_slot
    activate            (                                 ): BindingJS_API_slot
    deactivate          (                                 ): BindingJS_API_slot
    pause               (                                 ): BindingJS_API_slot
    resume              (                                 ): BindingJS_API_slot
}

/*  external slot API  */
interface BindingJS_API_slot {
    length              (                                 ): number
    find                (   element: HTMLElement          ): number
    get                 (                                 ): any[]
    get                 (   indexBegin: number,
                            indexEnd: number              ): any[]
    get                 (   index: number                 ): any
    set                 (   index: number,
                            elements: HTMLElement[]       ): void
    set                 (   index: number,
                            ...element: HTMLElement[]     ): void
    splice              (   index: number,
                            len: number,
                            elements: HTMLElement[]       ): any[]
    splice              (   index: number,
                            len: number,
                            ...element: HTMLElement[]     ): any[]
    push                (   elements: HTMLElement[]       ): void
    push                (   ...element: HTMLElement[]     ): void
    pop                 (                                 ): any
    unshift             (   elements: HTMLElement[]       ): void
    unshift             (   ...element: HTMLElement[]     ): void
    shift               (                                 ): any
    delete              (   index: number                 ): void
    delete              (   elements: HTMLElement[]       ): void
    delete              (   ...element: HTMLElement[]     ): void
    delete              (                                 ): void
}

