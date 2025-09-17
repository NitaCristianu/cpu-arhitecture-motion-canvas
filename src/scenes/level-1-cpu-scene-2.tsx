import {
  Circle,
  Grid,
  Icon,
  makeScene2D,
  Node,
  Ray,
  Rect,
  Shape,
  Txt,
  View2D,
} from "@motion-canvas/2d";
import { buildCPULevel0, RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { createScene } from "../components/presets";
import {
  all,
  any,
  chain,
  clamp,
  createRefArray,
  createSignal,
  delay,
  easeInBack,
  easeInCubic,
  easeInOutBack,
  easeInOutCubic,
  easeInOutQuad,
  easeOutBack,
  easeOutBounce,
  easeOutCirc,
  easeOutCubic,
  easeOutElastic,
  linear,
  loop,
  range,
  sequence,
  tween,
  useRandom,
  Vector2,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import Camera from "../libs/Thrash/Camera";
import { Line, MeshPhysicalMaterial, Spherical, Vector3 } from "three";
import { Label3D } from "../components/Label3D";
import { buildCPULevel1 } from "../utils/cpus/buildCPULevel1";
import { Glass } from "../components/GlassRect";
import Box from "../libs/Thrash/objects/Box";
import { createInfoCard } from "../utils/infocard";

export const ALU_OPERATIONS = [
  "ADD",
  "SUB",
  "MUL",
  "DIV",
  "MOD",
  "AND",
  "ORR",
  "XOR",
  "NOT",
  "SHL",
  "SHR",
  "CMP",
];

export default makeScene2D(function* (view: View2D) {
  view.fill("#000");
  // 3D SCENE
  const scene = createScene(new Vector3(-1.5, 1, 1.5));
  const alu = new Box({
    key: "level_1 ALU",
    material: new MeshPhysicalMaterial({
      color: 0x00a0ff,
      metalness: 0.5,
    }),
    localScale: new Vector3(0.02, 0.18, 0.13),
    localPosition: new Vector3(0.0, 0.3, 0),
    localRotation: new Vector3(0, 0, Math.PI / 2),
  });
  scene.add(alu);

  const level0_cpu = buildCPULevel0(scene);
  view.add(scene);

  // TIMELINE

  const camera: Camera = scene.findFirst(
    (child) => child instanceof Camera
  ) as any;
  yield* camera.lookTo(level0_cpu.base.getGlobalPosition(), 0);

  yield* waitUntil("begin");
  yield* sequence(
    0.3,
    level0_cpu.group.popIn(1),
    level0_cpu.ram.popIn(1, RAM_SCALE)
  );
  yield* level0_cpu.initWires();
  yield level0_cpu.container.rotateTo(new Vector3(0, -1, 0), 8),
    yield* alu.startIdleRotation(["y", "x", "z"], 8);
  yield* waitUntil("alu");
  const context_title = createInfoCard(
    "ALU (Arithmetic Logic Unit)",
    {
      props: {
        top: [0, -view.size().y / 2 - 250],
        disableShader: true,
        shadowBlur: 20,
        shadowColor: "#fff5",
      },
      width: 1900,
    },
    view
  );
  yield* all(
    camera.lookTo(alu.getGlobalPosition(), 1.5),
    camera.zoomIn(2.5, 1.5)
  );
  yield context_title.node.y(context_title.node.y() + 350, 1, easeOutCubic);

  yield* waitUntil("fall");
  yield* any(
    camera.lookTo(level0_cpu.group.getGlobalPosition(), 1, easeInOutCubic),
    camera.zoomOut(1 / 2.5, 1, easeInOutCubic),
    context_title.node.y(context_title.node.y() - 350, 1, easeOutCubic),
    delay(
      0.2,
      all(
        alu.reposition(level0_cpu.iu.getGlobalPosition(), 1, easeInOutCubic),
        alu.rotateTo(
          new Vector3(0, level0_cpu.container.localRotation().y, Math.PI / 2),
          1
        ),
        delay(
          1,
          alu.rotateTo(
            new Vector3(0, level0_cpu.container.localRotation().y, Math.PI / 2),
            81
          )
        )
      )
    ),
    delay(0.3, all(level0_cpu.iu.moveDOWN(3, 2, easeInCubic))),
    level0_cpu.hideWires(level0_cpu.wires)
  );

  yield* waitUntil("purpose");
  yield* all(camera.lookTo(alu.getGlobalPosition()), camera.zoomIn(2.6, 1));
  const surface = (
    <Ray from={[800, 100]} to={[-400, 100]} />
  ) as Ray;
  view.add(surface);
  const rnd = useRandom(2);
  const ops = range(ALU_OPERATIONS.length).map((i) => (
    <Txt
      position={surface.getPointAtPercentage(rnd.nextFloat(0, 1)).position}
      text={ALU_OPERATIONS[i]}
      fontFamily={"Poppins"}
      fontWeight={700}
      fill={"#fffd"}
      scale={0}
      fontSize={80}
    />

  ));
  ops.forEach(p=>view.add(p));
  yield* sequence(.2,
    ...ops.map(op=>all(
      op.scale(1, .6, easeOutBack,).wait(.7).to(0,.5, easeInBack),
      op.y(op.y()-rnd.nextInt(240, 500), 3),
    ))
  )

  yield* waitUntil("next");
});
