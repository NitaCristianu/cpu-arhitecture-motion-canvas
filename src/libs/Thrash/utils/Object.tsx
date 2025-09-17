import { computed, initial, Node, NodeProps, signal } from "@motion-canvas/2d";
import { Vector3, Object3D } from "three";
import Scene3D from "../Scene";
import { createComputed, SimpleSignal } from "@motion-canvas/core";

export interface ObjectProps extends NodeProps {
  localPosition?: Vector3;
  localScale?: Vector3;
  localRotation?: Vector3;
}

export default class Object extends Node {
  public core: Object3D = new Object3D();
  public master: Scene3D = null;
  public initialized = false;

  @initial(new Vector3(0, 0, 0))
  @signal()
  public declare readonly localPosition: SimpleSignal<Vector3, this>;

  @initial(new Vector3(1, 1, 1))
  @signal()
  public declare readonly localScale: SimpleSignal<Vector3, this>;

  @initial(new Vector3(0, 0, 0))
  @signal()
  public declare readonly localRotation: SimpleSignal<Vector3, this>;

  @signal()
  public declare readonly POSITION_STRING: SimpleSignal<string, this>;

  @signal()
  public declare readonly SCALE_STRING: SimpleSignal<string, this>;

  @signal()
  public declare readonly ROTATION_STRING: SimpleSignal<string, this>;

  public constructor(props: ObjectProps) {
    super({ ...props });

    // Set signals via setters
    if (props.localPosition) this.localPosition(props.localPosition);
    if (props.localScale) this.localScale(props.localScale);
    if (props.localRotation) this.localRotation(props.localRotation);

    this.POSITION_STRING(
      `[${this.localPosition().x.toFixed(2)}, ${this.localPosition().y.toFixed(
        2
      )}, ${this.localPosition().z.toFixed(2)}]`
    );

    this.SCALE_STRING(
      `[${this.localScale().x.toFixed(2)}, ${this.localScale().y.toFixed(
        2
      )}, ${this.localScale().z.toFixed(2)}]`
    );

    this.ROTATION_STRING(
      `[${this.localRotation().x.toFixed(2)}, ${this.localRotation().y.toFixed(
        2
      )}, ${this.localRotation().z.toFixed(2)}]`
    );
  }

  public init(master: Scene3D, parent: Object3D) {
    if (this.initialized) return;
    this.initialized = true;
    this.master = master;
    parent.add(this.core);

    this.children().forEach((child) => {
      if (child instanceof Object) {
        child.init(master, this.core);
      }
    });
  }

  public  getGlobalPosition(): Vector3 {
    const pos = new Vector3();
    if (this.core) {
      this.core.getWorldPosition(pos);
    }
    return pos;
  }
}
