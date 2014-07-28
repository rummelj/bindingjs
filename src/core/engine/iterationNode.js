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
        let clone = new _api.engine.iterator.IterationNode(this.iterated)
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
    }
    
    spawnChild(bindingScopePrefix, tempRefCounter) {
        if (!this.isIterated()) {
            throw _api.util("Can only spawn children of iterated nodes")
        }
        
        let newChild = new _api.engine.iterator.IterationNode(false)
        
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
            let newTemplate = this.$iteratedTemplate.clone()
            this.getTemplate().after(newTemplate)
            newChild.setTemplate(newTemplate)
        } else {
            let sample = this.getChildren()[0]
            for (var i = 0; i < sample.getChildren().length; i++) {
                newChild.add(sample.getChildren()[i].clone())
            }
            let newTemplate = this.$iteratedTemplate.clone()
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
        
        // If this was the first child, set the entryIds and keyIds
        // Since new children will use the first as a sample
        if (this.iterationInstances === 0) {
            //this.setIterationEntryId(newEntryId)
            //this.setIterationKeyId(newKeyId)
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
        return this.$template
    }
    
    setTemplate($template) {
        if (this.isIterated) {
            this.$template = $("<!-- -->")
            this.$iterationTemplate = $template.clone()
            $template.replaceWith(this.$template)
        } else {
            this.$template = $template
        }
    }
    
    getParent() {
        return this.parent
    }
    
    add(child) {
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
 }
 
 _api.engine.iterator.IterationNode = IterationNode