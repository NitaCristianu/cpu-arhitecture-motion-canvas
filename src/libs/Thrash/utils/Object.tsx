import { initial, Node, NodeProps, signal } from "@motion-canvas/2d";
import { Vector3, Object3D } from "three";
import Scene3D from "../Scene";
import { SimpleSignal } from "@motion-canvas/core";

export interface ObjectProps extends NodeProps {
  localPosition?: Vector3;
  localScale?: Vector3;
  localRotation?: Vector3;
}

export default class Object extends Node {
  public core: Object3D = new Object3D();
  public master: Scene3D = null;

  @initial(new Vector3(0, 0, 0))
  @signal()
  public declare readonly localPosition: SimpleSignal<Vector3, this>;

  @initial(new Vector3(1, 1, 1))
  @signal()
  public declare readonly localScale: SimpleSignal<Vector3, this>;

  @initial(new Vector3(0, 0, 0))
  @signal()
  public declare readonly localRotation: SimpleSignal<Vector3, this>;

  public initialized: boolean = false;

  public constructor(props: ObjectProps) {
    super({ ...props });

    // Apply local transforms if provided
    if (props.localPosition) {
      this.core.position.copy(props.localPosition);
    }

    if (props.localScale) {
      this.core.scale.copy(props.localScale);
    }
  }

  public init(master: Scene3D, parent: Object3D) {
    this.initialized = true;
    this.master = master;
    parent.add(this.core);

    this.children().forEach((child) => {
      if (child instanceof Object) {
        child.init(master, this.core);
      }
    });
  }
}

export class Group extends Object {}
