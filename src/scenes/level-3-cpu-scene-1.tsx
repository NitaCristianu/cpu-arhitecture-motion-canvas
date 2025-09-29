import { makeScene2D } from "@motion-canvas/2d";
import { waitFor, waitUntil } from "@motion-canvas/core";
import { createScene } from "../components/presets";
import { Vector3 } from "three";
import { buildCPULevel2 } from "../utils/cpus/buildCPULevel2";

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(-1.5, 1, 1.5));
  const cpu = buildCPULevel2(scene);

  view.add(scene);
  scene.init();

  yield* waitUntil("begin");

  yield* waitFor(1);
  yield* waitUntil("next");
});
 