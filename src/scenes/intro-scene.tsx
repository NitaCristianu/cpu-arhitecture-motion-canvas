import { makeScene2D, Rect, Txt, View2D } from "@motion-canvas/2d";
import { MeshPhysicalMaterial } from "three";
import {
  waitFor,
  all,
  easeOutBack,
  easeInOutCubic,
  easeOutBounce,
  chain,
  easeOutCubic,
  easeInCubic,
  easeInQuad,
  easeOutSine,
  easeInSine,
} from "@motion-canvas/core";
import { createScene } from "../components/presets";
import Box from "../libs/Thrash/objects/Box";
import Group from "../libs/Thrash/objects/Group";
import { Vector3 } from "three";
import Camera from "../libs/Thrash/Camera";
import Scene3D from "../libs/Thrash/Scene";
import Line from "../libs/Thrash/objects/Line";
import { Label3D } from "../components/Label3D";
import { buildCPULevel0 } from "../utils/cpus/buildCPULevel0";
import Mesh from "../libs/Thrash/objects/Mesh";

// GLOBAL USED ELEMENTS
var ram: Box;
var cpu: Mesh;
// car + fridge + cpu presentation
export function* SubScene1(scene: Scene3D, camera: Camera, view: View2D) {
  // --- Create a group for elements ---
  const group = new Group({ renderable: false });

  // --- Computer (outer) centered ahead ---
  const computer = (
    <Box
      material={new MeshPhysicalMaterial({ color: 0x2196f3 })}
      alpha={1}
      localScale={new Vector3(0, 0, 0)}
      localPosition={new Vector3(0, 0, -1)}
    />
  ) as Box;

  // --- CPU inside ---
  const cpu = (
    <Box
      material={new MeshPhysicalMaterial({ color: 0xffeb3b })}
      alpha={1}
      localScale={new Vector3(0.15, 0.15, 0.15)}
      localPosition={new Vector3(0, 0, -0.4)}
    />
  ) as Box;
  computer.core.add(cpu.core);

  // --- Car (to the right, slightly back) ---
  const car = (
    <Box
      material={new MeshPhysicalMaterial({ color: 0xf44336 })}
      alpha={1}
      localScale={new Vector3(0, 0, 0)}
      localPosition={new Vector3(2, 0, -0.5)}
    />
  ) as Box;

  // --- Fridge (above and back) ---
  const fridge = (
    <Box
      material={new MeshPhysicalMaterial({ color: 0x4caf50 })}
      alpha={1}
      localScale={new Vector3(0, 0, 0)}
      localPosition={new Vector3(0, 1.5, 0)}
    />
  ) as Box;

  // Add to group
  group.add(computer);
  group.add(car);
  group.add(fridge);

  // Add group to scene
  scene.add(group);

  scene.init();
  view.add(scene);

  // --- 1s pause ---
  yield* waitFor(0.5);
  yield camera.lookUp(0.1);
  yield* waitFor(0.5);

  // Pop in computer and start idle rotation
  yield* computer.popIn(0.4, new Vector3(0.3, 0.4, 0.6), easeOutBack);
  yield computer.startIdleRotation();

  // Fade outer to reveal CPU
  yield* waitFor(0.4);
  yield* chain(
    cpu.popIn(0.4, new Vector3(0.15, 0.15, 0.15), easeOutBack),
    computer.fadeTo(0.2, 1, easeInOutCubic)
  );

  // Wait before car smash
  yield* waitFor(1);

  /* ── CAR CHOREOGRAPHY ───────────────────────────────────── */

  /* 1 ▸ spawn with punchy scale-in */
  yield* car.popIn(
    0.25,
    new Vector3(0.6, 0.29, 0.25).multiplyScalar(2),
    easeOutBack
  );

  /* 2 ▸ drift-approach: swing the rear, front points at PC */
  yield* all(
    car.reposition(new Vector3(1.3, -0.1, -1.6), 0.18, easeInCubic), // lateral slide
    car.rotateTo(new Vector3(0, Math.PI / 10, 0), 0.18, easeInCubic) // slight yaw
  );

  /* 3 ▸ tyre-screech snap into line, nose locked on target */
  yield all(
    camera.moveTo(camera.localPosition().clone().add(new Vector3(0, 1, 2)), 0.4)
  );
  yield* all(
    car.reposition(new Vector3(0.35, -0.1, -0.9), 0.12, easeOutCubic),
    car.rotateTo(new Vector3(0, Math.PI / 18, 0), 0.12, easeOutCubic)
  );

  /* 4 ▸ IMPACT — shove the computer, car jolts & rotates */
  yield* all(
    car.reposition(new Vector3(0.1, -0.1, -1.0), 0.14, easeOutCubic),
    car.rotateTo(new Vector3(0, Math.PI / 6, 0), 0.14, easeOutCubic),

    computer.reposition(new Vector3(-4, 1.5, 15), 0.2, easeInQuad),
    computer.fadeOut(0.2)
  );

  /* 5 ▸ REBOUND — car slides back, suspension bounce */
  yield* all(
    car.reposition(new Vector3(0.2, -0.1, -0.85), 0.3, easeOutCubic),
    car.rotateTo(new Vector3(0, Math.PI / 20, 0), 0.3, easeOutBounce)
  );

  /* Car settles centre-frame */
  yield* car.reposition(new Vector3(0, -0.1, -0.8), 0.6, easeOutCubic);

  // Computer jumps off-screen
  yield* computer.popOut(0.5, easeInOutCubic);

  // Wait before fridge drop
  yield* waitFor(1);

  // Fridge falls into view (front of car)
  yield fridge.popIn(0.4, new Vector3(0.4, 0.6, 0.4), easeOutBack);
  yield* fridge.reposition(new Vector3(0, -0.09, -0.5), 0.7, easeInCubic);
  yield all(camera.zoomOut(1.6, 1));

  // Slide group to the side
  yield* waitFor(1.5);
  yield* group.reposition(new Vector3(-2, 0, 0), 1, easeInOutCubic);
  group.remove();
}
// cpu current flow and instructino logic
export function* SubScene2(scene: Scene3D, camera: Camera, view: View2D) {
  const level0cpu = buildCPULevel0(scene);
  cpu = level0cpu.group;
  ram = level0cpu.ram;

  // 1) CPU enters → camera snaps to it
  //
  yield* all(
    camera.moveTo(camera.localPosition().divideScalar(1.3)),
    cpu.popIn(0.5, new Vector3(1, 1, 1), easeOutBack),
    camera.lookTo(cpu.localPosition(), 0.5, easeInOutCubic)
  );

  //
  // 2) small gap, then RAM enters → camera pans to RAM
  //

  yield* waitFor(0.15);
  yield* all(
    ram.popIn(0.5, new Vector3(0.2, 0.6, 0.25), easeOutBack),
    camera.lookTo(ram.localPosition(), 0.5, easeInOutCubic)
  );
  yield* all(camera.lookTo(cpu.localPosition(), 0.6, easeOutSine));
  yield* level0cpu.initWires();
  yield* all(
    camera.moveTo(
      cpu.localPosition().add(new Vector3(0.5, 5, 1.2)),
      0.6,
      easeOutSine
    ),
    camera.zoomIn(2.2)
  );

  // === LEVEL 0  CPU EXECUTION PATH CAMERA TOUR ===
  yield* waitFor(0.4);

  const offset = new Vector3(0, -0.35, 0);

  const delay_offset = 1.2;

  camera.anchor(cpu.localPosition().clone().add(new Vector3(0, -0.2, 0.8)));
  camera.anchorWeight(0.7);

  // RAM ➝ MC
  yield level0cpu.wire_mc_ram_data.reverseFlow(1);
  yield* all(
    camera.moveToWeighted(
      ram.localPosition().clone().add(new Vector3(-0.3, 1.3, 0.8)),
      delay_offset,
      easeInOutCubic
    ),
    camera.lookTo(
      ram.localPosition().add(new Vector3(-0.2, 0, 0)),
      delay_offset,
      easeOutSine
    )
  );

  // MC ➝ CU
  yield level0cpu.wire_mc_cu.currentFlow(1, easeInSine, 50);
  yield* all(
    camera.moveToWeighted(
      level0cpu.iu
        .localPosition()
        .clone()
        .add(offset)
        .lerp(level0cpu.cu.localPosition().clone().add(offset), 0.4)
        .add(new Vector3(-1.1, 1.3, 0.8)),
      delay_offset,
      easeInOutCubic
    ),
    camera.lookTo(
      level0cpu.iu
        .localPosition()
        .clone()
        .add(offset)
        .add(new Vector3(0.1, -0.3, 0)),
      delay_offset,
      easeOutSine
    )
  );

  // CU ➝ GPR
  yield level0cpu.wire_cu_gpr.currentFlow(1); // assuming VR is part of GPR here
  yield* all(
    camera.moveToWeighted(
      level0cpu.cu
        .localPosition()
        .clone()
        .add(offset)
        .lerp(level0cpu.gpr.localPosition().clone().add(offset), 0.4)
        .add(new Vector3(0, 1.2, 0.6)),
      delay_offset,
      easeInOutCubic
    ),
    camera.lookTo(
      level0cpu.gpr.localPosition().clone().add(offset),
      delay_offset,
      easeOutSine
    )
  );

  // CU ➝ IU
  yield level0cpu.wire_cu_iu.currentFlow(1);
  yield* all(
    camera.moveTo(
      level0cpu.cu
        .localPosition()
        .clone()
        .add(offset)
        .lerp(level0cpu.iu.localPosition().clone().add(offset), 0.4)
        .add(new Vector3(0, 2.25, 0.65)),
      delay_offset,
      easeInOutCubic
    ),
    camera.lookTo(
      level0cpu.iu.localPosition().clone().add(offset),
      delay_offset,
      easeOutSine
    )
  );
  yield level0cpu.wire_iu_mc.currentFlow(1);

  // CU ➝ MC
  yield level0cpu.wire_mc_cu.reverseFlow(1);
  yield* waitFor(0.2);
  yield* all(
    camera.moveTo(
      level0cpu.cu
        .localPosition()
        .clone()
        .add(offset)
        .lerp(level0cpu.mc.localPosition().clone().add(offset), 0.4)
        .add(new Vector3(0.2, 1.2, 0.8)),
      delay_offset,
      easeInOutCubic
    ),
    camera.lookTo(
      level0cpu.mc.localPosition().clone().add(offset),
      delay_offset,
      easeOutSine
    )
  );

  // MC ➝ RAM
  yield level0cpu.wire_mc_ram_data.currentFlow(1.4);
  yield* all(
    camera.moveTo(
      ram.localPosition().clone().add(new Vector3(-3, 2, 0)),
      2,
      easeInOutCubic
    ),
    camera.lookTo(
      ram.localPosition().add(new Vector3(0.25, 0, 0)),
      2,
      easeOutSine
    )
  );

  yield all(
    camera.moveTo(
      ram.localPosition().clone().add(new Vector3(0, 2, 0)),
      2,
      easeInOutCubic
    ),
    camera.lookTo(
      ram.localPosition().add(new Vector3(-0.1, 0, 0)),
      2,
      easeOutSine
    ),
    camera.zoomIn(2, 2)
  );
}

export default makeScene2D(function* (view) {
  // Master container
  const scene = createScene(new Vector3(0, 0.7, 3).divideScalar(2));
  const camera = scene.findFirst((child) => child instanceof Camera) as any;

  yield* SubScene1(scene, camera, view);
  yield* SubScene2(scene, camera, view);

  yield* waitFor(2);
});
