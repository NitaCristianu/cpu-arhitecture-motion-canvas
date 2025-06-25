import { Circle, makeScene2D } from "@motion-canvas/2d";
import { createRef, useLogger } from "@motion-canvas/core";
import Scene from "../libs/Thrash/Scene";
import Group from "../libs/Thrash/utils/Object";
import Box from "../libs/Thrash/objects/Box";
import Camera from "../libs/Thrash/Camera";
import { Vector3 } from "three";
import Lights from "../libs/Thrash/utils/Lights";
import Floor from "../libs/Thrash/utils/Floor";
import EnvMap from "../libs/Thrash/utils/EnvMap";

export default makeScene2D(function* (view) {
  //  const scene3D = <Scene3D/>
  // view.add(scene3D)
  // aadd children

  const scene = (
    <Scene>
      <Box materialType="blocky" />
      {/* <Floor  /> */}
      <Camera localPosition={new Vector3(2, 1, -2)} />
      <Lights />
      <EnvMap url="../assets/hdr/studio_small_03_8k.hdr" applyToBackground />
    </Scene>
  ) as Scene;

  scene.init();

  view.add(scene);
});
