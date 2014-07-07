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
    template            (   template: any                 ): BindingJS_API_binding
    model               (   model: any                    ): BindingJS_API_binding
}

