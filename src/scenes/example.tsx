import { Circle, makeScene2D } from "@motion-canvas/2d";
import { MeshPhysicalMaterial, Vector3 } from "three";
import { createRef, waitFor, waitUntil } from "@motion-canvas/core";
import Model from "../libs/Thrash/objects/Model";
import cpuURL from "../models/cpu.glb?url";
import { createScene } from "../components/presets";
import Box from "../libs/Thrash/objects/Box";
import Line from "../libs/Thrash/objects/Line";

export default makeScene2D(function* (view) {
  const myLine = new Line({
    points: [new Vector3(0, 0, 0), new Vector3(.1, .4, 0), new Vector3(.3, 0, 0)],
    smooth: true,
    color: 0xaa5454,
    lineWidth: 25,
    dashed: false,
    opacity: 0.8,
  });
  
  const scene = createScene();
  scene.add(myLine);
  
  scene.init();
  view.add(scene);
  
  yield* waitFor(1);
  yield* myLine.updatePoints(
    [new Vector3(0, 0, 0), new Vector3(-.5, -.3, 0), new Vector3(.5, 0, .3)],
    1
  );

  yield* waitFor(2);
});
