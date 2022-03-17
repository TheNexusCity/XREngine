import { store } from '@xrengine/client-core/src/store'
import { EntityTreeNode } from '@xrengine/engine/src/ecs/classes/EntityTree'
import { createEntity } from '@xrengine/engine/src/ecs/functions/EntityFunctions'
import {
  createEntityNode,
  getEntityNodeArrayFromEntities
} from '@xrengine/engine/src/ecs/functions/EntityTreeFunctions'
import { useWorld } from '@xrengine/engine/src/ecs/functions/SystemHooks'
import { ScenePrefabs } from '@xrengine/engine/src/scene/functions/registerPrefabs'

import EditorCommands from '../constants/EditorCommands'
import { serializeObject3D, serializeObject3DArray } from '../functions/debug'
import { updateOutlinePassSelection } from '../functions/updateOutlinePassSelection'
import { CommandManager } from '../managers/CommandManager'
import { ControlManager } from '../managers/ControlManager'
import { SceneManager } from '../managers/SceneManager'
import { accessSelectionState, SelectionAction } from '../services/SelectionServices'
import Command, { CommandParams } from './Command'

export interface GroupCommandParams extends CommandParams {
  /** Parent object which will hold objects being added by this command */
  parents?: EntityTreeNode | EntityTreeNode[]

  /** Child object before which all objects will be added */
  befores?: EntityTreeNode | EntityTreeNode[]
}

export default class GroupCommand extends Command {
  groupParents?: EntityTreeNode[]

  groupBefores?: EntityTreeNode[]

  oldParents: EntityTreeNode[]

  oldBefores: EntityTreeNode[]

  groupNode: EntityTreeNode

  constructor(objects: EntityTreeNode[], params: GroupCommandParams) {
    super(objects, params)

    this.groupParents = params.parents ? (Array.isArray(params.parents) ? params.parents : [params.parents]) : undefined
    this.groupBefores = params.befores ? (Array.isArray(params.befores) ? params.befores : [params.befores]) : undefined

    if (this.keepHistory) {
      this.oldParents = []
      this.oldBefores = []
      this.oldSelection = accessSelectionState().selectedEntities.value.slice(0)

      const tree = useWorld().entityTree

      for (let i = this.affectedObjects.length - 1; i >= 0; i--) {
        const object = this.affectedObjects[i]

        if (!object.parentEntity) throw new Error('Parent is not defined')
        const parent = tree.entityNodeMap.get(object.parentEntity)
        if (!parent) throw new Error('Parent is not defined')
        this.oldParents.push(parent)

        const before = tree.entityNodeMap.get(parent.children![parent.children!.indexOf(object.entity) + 1])
        if (!before) throw new Error('Before is not defined')
        this.oldBefores.push(before!)
      }
    }
  }

  execute() {
    this.emitBeforeExecuteEvent()

    this.groupNode = createEntityNode(createEntity())
    CommandManager.instance.executeCommand(EditorCommands.ADD_OBJECTS, this.groupNode, {
      parents: this.groupParents,
      befores: this.groupBefores,
      shouldEmitEvent: false,
      isObjectSelected: false,
      prefabTypes: ScenePrefabs.group
    })

    CommandManager.instance.executeCommand(EditorCommands.REPARENT, this.affectedObjects, {
      parents: this.groupNode,
      shouldEmitEvent: false,
      isObjectSelected: false
    })

    if (this.isSelected) {
      CommandManager.instance.executeCommand(EditorCommands.REPLACE_SELECTION, this.groupNode, {
        shouldEmitEvent: false
      })
    }

    this.emitAfterExecuteEvent()
  }

  undo() {
    CommandManager.instance.executeCommand(EditorCommands.REPARENT, this.affectedObjects, {
      parents: this.oldParents,
      befores: this.oldBefores,
      shouldEmitEvent: false,
      isObjectSelected: false
    })
    CommandManager.instance.executeCommand(EditorCommands.REMOVE_OBJECTS, this.groupNode, {
      deselectObject: false,
      shouldEmitEvent: false,
      skipSerialization: true
    })

    CommandManager.instance.executeCommand(
      EditorCommands.REPLACE_SELECTION,
      getEntityNodeArrayFromEntities(this.oldSelection)
    )
    this.emitAfterExecuteEvent()
  }

  toString() {
    return `GroupMultipleObjectsCommand id: ${this.id} objects: ${serializeObject3DArray(
      this.affectedObjects
    )} groupParent: ${serializeObject3D(this.groupParents)} groupBefore: ${serializeObject3D(this.groupBefores)}`
  }

  emitBeforeExecuteEvent() {
    if (this.shouldEmitEvent && this.isSelected) {
      ControlManager.instance.onBeforeSelectionChanged()
      store.dispatch(SelectionAction.changedBeforeSelection())
    }
  }

  emitAfterExecuteEvent() {
    if (this.shouldEmitEvent) {
      if (this.isSelected) {
        updateOutlinePassSelection()
      }

      SceneManager.instance.onEmitSceneModified()
      store.dispatch(SelectionAction.changedSceneGraph())
    }
  }
}
