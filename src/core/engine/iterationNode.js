/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 class IterationNode {
    constructor (iterated) {
        this.iterated = iterated
        this.iterationInstances = 0
        this.children = []
    }
    
    clone() {
        let clone = new _api.engine.IterationNode(this.iterated)
        clone.iterated = this.iterated
        clone.iterationInstances = this.iterationInstances
        clone.iterationSourceId = this.iterationSourceId
        clone.iterationEntryId = this.iterationEntryId
        clone.iterationKeyId = this.iterationKeyId
        clone.binding = this.binding.clone()
        let newTemplate = this.$template.clone()
        this.$template.after(newTemplate)
        clone.$template = newTemplate
        for (var i = 0; i < this.children.length; i++) {
            clone.add(this.children[i].clone())
        }
        return clone
    }
    
    spawnChild(bindingScopePrefix, tempRefCounter) {
        if (!this.isIterated()) {
            throw _api.util("Can only spawn children of iterated nodes")
        }
        
        let newChild = new _api.engine.IterationNode(false)
        
        let newBinding = this.binding.clone()
        // Add binding @entryId <- get(<index>) <- @input
        let newEntryId = "temp" + tempRefCounter.getNext()
        let newEntryRef = bindingScopePrefix + newEntryId
        let connector = "get(" + this.iterationInstances + ")"
        let collectionRef = bindingScopePrefix + this.getIterationSourceId()
        let entryBinding = _api.dsl.parser.safeParser(newEntryRef + " <- " + connector + " <- " + collectionRef, "binding")
        newBinding.add(entryBinding)
        
        // Add binding @keyId <~ <index>
        let newKeyId = "temp" + tempRefCounter.getNext()
        let newKeyRef = bindingScopePrefix + newKeyId
        let keyBinding = _api.dsl.parser.safeParser(newKeyRef + " <~ " + this.iterationInstances, "binding")
        newBinding.add(keyBinding)
        newChild.setBinding(newBinding)
        
        if (this.iterationInstances === 0) {
            for (var i = 0; i < this.getChildren().length; i++) {
                newChild.add(this.getChildren()[i])
            }
            this.children = []
            this.add(newChild)
            let newTemplate = this.getIterationTemplate().clone()
            this.getTemplate().after(newTemplate)
            newChild.setTemplate(newTemplate)
        } else {
            let sample = this.getChildren()[0]
            for (var i = 0; i < sample.getChildren().length; i++) {
                newChild.add(sample.getChildren()[i].clone())
            }
            let newTemplate = this.getIterationTemplate().clone()
            sample.getTemplate().after(newTemplate)
            newChild.setTemplate(newTemplate)
            this.add(newChild)
        }
        
        // Replace all references to entryId and keyId (Including children)
        let stack = []
        stack.push(newChild)
        while(stack.length > 0) {
            let current = stack.pop()
            for (var i = 0; i < current.getChildren(); i++) {
                stack.push(current.getChildren()[i])
            }
            let variables = current.binding.getAll("Variable")
            for (var i = 0; i < variables.length; i++) {
                let variable = variables[i]
                if (variable.get("ns") === bindingScopePrefix) {
                    if (variable.get("id") === this.getIterationEntryId()) {
                        variable.set("id", newEntryId)
                    } else if (variable.get("id") === this.getIterationKeyId) {
                        variable.set("id", newKeyId)
                    }
                }
            }
        }
        
        this.iterationInstances++
        return newChild
    }
    
    destroyChild() {
        if (!this.isIterated()) {
            throw _api.util("Can only destroy children of iterated nodes")
        }
        if (this.iterationInstances === 0) {
            throw _api.util.exception("No more children to destroy!")
        }
        
        this.iterationInstances--
        if (this.iterationInstances > 1) {
            let toRemove = this.children.pop()
            toRemove.getTemplate().remove()
            return toRemove
        } else {
            let child = this.children[0]
            for (var i = 0; i < child.getChildren().length; i++) {
                this.children.push(child.getChildren()[i])
            }
            
            let temp = this.children[0]
            // Remove the child
            this.children.splice(0, 1)
            return temp
        }
    }
    
    getBinding() {
        let result = []
        let children = this.getChildren()
        if (this.isIterated()) {
            for (var i = 0; i < children.length; i++) {
                if (!children[i].isIterated()) {
                    let childBinding = children[i].getBinding()
                    for (var j = 0; j < childBinding.length; j++) {
                        result.push(childBinding[j])
                    }
                }
            }
        } else {
            let temp = this.binding.clone()
            let iterationChildren = temp.getAll("IterationChild")
            for (var i = 0; i < iterationChildren.length; i++) {
                let iterationChild = iterationChildren[i]
                iterationChild.replace(children[i].getBinding())
            }
            result.push(temp)
        }
        return result
    }
    
    setBinding(binding) {
        this.binding = binding
    }
    
    getTemplate() {
        return $api.$()(this.$template)
    }
    
    setTemplate($template) {
        this.$template = $template
    }
    
    getIterationTemplate() {
        return $api.$()(this.$iterationTemplate)
    }
    
    setIterationTemplate($iterationTemplate) {
        this.$iterationTemplate = $iterationTemplate
    }
    
    getParent() {
        return this.parent
    }
    
    add(child) {
        if (!child) {
            throw _api.util.exception("Illegal parameter undefined")
        }
        
        this.children.push(child)
        child.parent = this
    }
    
    getChildren() {
        return this.children
    }
    
    setIterated(iterated) {
        this.iterated = iterated
    }
    
    isIterated() {
        return this.iterated
    }
    
    setIterationSourceId(tempRef) {
        this.iterationSourceId = tempRef
    }
    
    getIterationSourceId() {
        return this.iterationSourceId
    }
    
    setIterationEntryId(entryId) {
        this.iterationEntryId = entryId
    }
    
    getIterationEntryId() {
        return this.iterationEntryId
    }
    
    setIterationKeyId(keyId) {
        this.iterationKeyId = keyId
    }
    
    getIterationKeyId() {
        return this.iterationKeyId
    }
    
    setObserverId(observerId) {
        this.observerId = observerId
    }
    
    getObserverId() {
        return this.observerId
    }
    
    getIterationInstances() {
        return this.iterationInstances
    }
    
    walk (cb, after = false) {
        let _walk = (node, depth) => {
            if (!after)
                cb.call(null, node, depth)
            node.getChildren().forEach((child) => _walk(child, depth + 1))
            if (after)
                cb.call(null, node, depth)
        }
        _walk(this, 0)
    }
    
    dump() {
        let out = ""
        this.walk((node, depth) => {
            for (let i = 0; i < depth; i++)
                out += "    "
            out += "iterated=" + node.isIterated() + "\n"
            for (let i = 0; i < depth; i++)
                out += "    "
            out += "template=" + 
                (node.$template ?
                node.getTemplate().clone().wrap("<div>").parent().html() + "\n" :
                "undefined\n")
            for (let i = 0; i < depth; i++)
                out += "    "
            out += "iterationTemplate=" + 
                (node.$iterationTemplate ? 
                node.getIterationTemplate().clone().wrap("<div>").parent().html() + "\n" :
                "undefined\n")
            for (let i = 0; i < depth; i++)
                out += "    "
            out += "-----------------\n"
        })
        return out   
    }
 }
 
 _api.engine.IterationNode = IterationNode