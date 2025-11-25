import { makeScene2D } from "@motion-canvas/2d";
import { createScene } from "../components/presets";
import { buildCPULevel0 } from "../utils/cpus/buildCPULevel0";
import { buildCPULevel1 } from "../utils/cpus/buildCPULevel1";
import { buildCPULevel2 } from "../utils/cpus/buildCPULevel2";
import { Vector3 } from "three";
import { all, waitFor, waitUntil } from "@motion-canvas/core";

export default makeScene2D(function*(view){

      const scene = createScene(new Vector3(1.5,.4,1.5));
      const camera = scene.getCameraClass();

      const cpus = [
            buildCPULevel0(scene),
            buildCPULevel1(scene),
            buildCPULevel2(scene),
      ];

      cpus.forEach((cpu, i)=>cpu.container.core.position.set(i*1.5,0,0));
      view.add(scene);

      yield* waitUntil('begin');
      yield* all(
            ...cpus.map(cpu=>cpu.group.popIn()),
            camera.lookTo(cpus[0].base.getGlobalPosition(),2),
      )

      yield* waitFor(1);
      
      yield* waitUntil('next');
})