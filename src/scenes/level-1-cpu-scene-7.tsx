import {
  Circle,
  Code,
  Grid,
  Icon,
  lines,
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
  Color,
  createRef,
  createRefArray,
  createSignal,
  DEFAULT,
  delay,
  easeInBack,
  easeInCubic,
  easeInOutBack,
  easeInOutCubic,
  easeInOutQuad,
  easeInOutSine,
  easeInSine,
  easeOutBack,
  easeOutBounce,
  easeOutCirc,
  easeOutCubic,
  easeOutElastic,
  linear,
  loop,
  range,
  run,
  sequence,
  tween,
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
import COLORS from "../utils/colors";
import { ShaderBackground } from "../components/background";
import { Bitnumber } from "../utils/bitnumber";
import { AsmHighlighter } from "../utils/AsmHighlighter";

export default makeScene2D(function* (view: View2D) {
  view.fill("#000");
  // 3D SCENE
  const scene = createScene(new Vector3(-1.5, 1, -0.5));
  const level1_cpu = buildCPULevel1(scene);

  view.add(scene);
  scene.init();

  const camera: Camera = scene.findFirst(
    (child) => child instanceof Camera
  ) as any;
  yield* camera.lookTo(level1_cpu.base.getGlobalPosition(), 0);

  yield* waitUntil("begin");
  yield* sequence(
    0.3,
    level1_cpu.group.popIn(1),
    level1_cpu.ram.popIn(1, RAM_SCALE)
  );
  yield* level1_cpu.initWires(level1_cpu.wires);

  const list = (
    <Glass size={[1200, 1000]} translucency={1} borderModifier={-1} x={1300}>
      <Txt
        zIndex={1}
        shadowBlur={50}
        shadowColor={"#fff4"}
        fill={"white"}
        fontFamily={"Poppins"}
        fontSize={120}
        y={-350}
      >
        {" "}
        List of criteria{" "}
      </Txt>
      <Txt
        zIndex={1}
        fill={"#ededed"}
        fontFamily={"Poppins"}
        fontSize={70}
        y={-150}
      >
        1. Arithmetic ops support{" "}
      </Txt>
      <Ray
        fromX={-500}
        toX={500}
        stroke={"white"}
        y={-150}
        end={0}
        lineWidth={3}
        zIndex={2}
      />
      <Txt
        zIndex={1}
        fill={"#ededed"}
        fontFamily={"Poppins"}
        fontSize={70}
        y={0}
      >
        2. Dynamic addresses{" "}
      </Txt>
      <Txt
        zIndex={1}
        fill={"#ededed"}
        fontFamily={"Poppins"}
        fontSize={70}
        y={150}
      >
        3. Operations subsequently
      </Txt>
      <Txt
        zIndex={1}
        shadowBlur={50}
        shadowColor={"#fff4"}
        fill={"#fff5"}
        fontFamily={"Poppins"}
        fontSize={50}
        y={350}
      >
        {" "}
        Features of the level 1 CPU{" "}
      </Txt>
      <Ray
        fromX={-500}
        toX={500}
        stroke={"white"}
        end={0}
        lineWidth={3}
        zIndex={2}
      />{" "}
      <Ray
        fromX={-500}
        toX={500}
        stroke={"white"}
        end={0}
        y={150}
        lineWidth={3}
        zIndex={2}
      />
    </Glass>
  );
  list.save();
  list.x(2500);
  list.scale(0.5);
  view.add(list);

  yield* waitUntil("list");
  yield all(
    camera.lookTo(
      level1_cpu.base.getGlobalPosition().add(new Vector3(0, -0.2, 0.3)),
      3
    )
  );
  yield* list.restore(1, easeOutCubic);
  yield* all(
    ...list
      .children()
      .map((c) =>
        c instanceof Ray
          ? c.end(1, 1)
          : c instanceof Txt
          ? c.opacity(0.5, 1)
          : null
      )
  );

  yield* waitUntil("clock");
  yield* all(
    list.x(2500, 1),
    list.scale(0.5, 1),
    camera.lookTo(level1_cpu.clock.getGlobalPosition(), 1),
    camera.zoomIn(3, 2, easeInOutCubic)
  );
  yield* waitUntil("tick");
  yield loop((i) =>
    chain(
      all(
        level1_cpu.clock.expand(),
        level1_cpu.wire_clock_cu.currentFlow(0.3, easeInOutSine, 190)
      ),
      level1_cpu.clock.shrink(),
      waitFor(0.4)
    )
  );

  yield* waitUntil("lookat");
  yield* all(
    camera.moveTo(new Vector3(-0.5, 0.2, 1.5), 2),
    camera.zoomOut(0.25, 2, easeInOutCubic),
    camera.lookAt(new Vector3(0.2, -0.35, 0), 2)
  );
  yield loop((i) =>
    chain(
      all(
        level1_cpu.wire_pc_mc.currentFlow(0.4, easeInOutSine, 120)
      ),

      // ── MC → RAM: fetch instruction ──
      all(
        level1_cpu.wire_mc_ram_address.currentFlow(0.4, easeInOutSine, 100),
        level1_cpu.wire_mc_ram_data.currentFlow(0.4, easeInOutSine, 100),
      ),

      // ── RAM → IR: instruction loaded ──
      all(
        level1_cpu.wire_mc_ir_margin.currentFlow(0.4, easeInOutSine, 100)
      ),

      // ── IR → CU: decode instruction ──
      all(
        level1_cpu.wire_ir_cu.currentFlow(0.3, easeInOutSine, 80)
      ),

      // ── CU → ALU (if arithmetic) ──
      all(
        level1_cpu.wire_cu_iu.currentFlow(0.4, easeInOutSine, 80)
      ),

      // ── GPR ↔ ALU: operand in / result out ──
      all(
        level1_cpu.wire_gpr_iu.currentFlow(0.4, easeInOutSine, 100)
      ),

      // ── ALU → MC: store back or memory op ──
      all(
        level1_cpu.wire_iu_mc.currentFlow(0.4, easeInOutSine, 100)
      ),

      waitFor(0.5)
    )
  );
  yield* waitFor(2);
  yield* all(
 camera.moveTo(new Vector3(-1.2, 0.5, -1.3),3),
 camera.lookTo(new Vector3(0,-.35,0),3),
  )


  yield* waitUntil("next");
});
