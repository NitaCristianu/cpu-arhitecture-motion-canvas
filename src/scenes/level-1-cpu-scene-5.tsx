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
  yield* all(camera.lookTo(level1_cpu.ir.getGlobalPosition(), 3));

  yield* waitUntil("back");

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
      />
    </Glass>
  );
  list.save();
  list.x(2500);
  list.scale(0.5);
  const code = createRef<Code>();
  const code_container = (
    <Glass
      size={[800, 1000]}
      translucency={1}
      borderModifier={-1}
      x={() => list.x() * -1}
    >
      <Code
        highlighter={new AsmHighlighter()}
        ref={code}
        zIndex={1}
        fontSize={100}
        code={`\
LOAD 0x10
ADD 0x11
SUB 0x12
INC
DEC
SHR
STORE 0x20`}
      ></Code>
    </Glass>
  ) as Glass;
  view.add(list);
  view.add(code_container);
  yield code().selection(lines(-1, -1));
  yield loop(40, (i) => code().selection(lines(i % 7, i % 7), 0.2));

  yield level1_cpu.container.rotateTo(new Vector3(0, -2.3, 0), 15);
  yield* waitUntil("list");
  yield* list.restore(1, easeOutCubic);

  const IR_ref = createRef<Glass>();
  const ACC_ref = createRef<Glass>();
  const gpr = (
    <Glass
      size={[1100, 600]}
      fill={new Color(COLORS["busAddr"]).alpha(0.1)}
      lightness={-0.2}
      scale={0}
    >
      <Txt
        zIndex={1}
        fontSize={120}
        fontWeight={400}
        fill={new Color(COLORS["busAddr"]).brighten(4)}
        shadowBlur={10}
        shadowColor={"#000a"}
        text={"REGISTERS"}
        fontFamily={"Poppins"}
        y={-180}
      />
      <Rect
        width={800}
        height={5}
        fill={new Color(COLORS["busAddr"]).brighten(4)}
        zIndex={1}
        y={-100}
        radius={100}
      />
      <Glass
        width={900}
        height={130}
        zIndex={1}
        y={30}
        lightness={-0.3}
        blurstrength={10}
        ref={IR_ref}
        scale={0}
      >
        <Txt
          zIndex={1}
          fontSize={70}
          fontWeight={300}
          shadowBlur={10}
          fill={new Color(COLORS["memory"]).brighten(5)}
          fontFamily={"Poppins"}
          shadowColor={"#000a"}
          text={" IR: 0010 01110"}
          width={800}
        />
        <Txt
          zIndex={1}
          fontSize={70}
          fontWeight={200}
          fill={"999"}
          shadowBlur={10}
          fontFamily={"Poppins"}
          shadowColor={"#000a"}
          text={"8bit"}
          width={800}
          textAlign={"right"}
        />
        <Icon
          icon={"tabler:lock-filled"}
          color={"999"}
          scale={0}
          size={60}
          zIndex={1}
          x={230}
        />
      </Glass>
      <Glass
        width={900}
        height={130}
        zIndex={1}
        y={200}
        lightness={-0.3}
        blurstrength={10}
        scale={0}
        ref={ACC_ref}
      >
        <Txt
          zIndex={1}
          fontSize={70}
          fontWeight={300}
          shadowBlur={10}
          fontFamily={"Poppins"}
          fill={new Color(COLORS["memory"]).brighten(5)}
          shadowColor={"#000a"}
          text={"VR: 0000 0010"}
          width={800}
        />
        <Txt
          zIndex={1}
          fontSize={70}
          fontWeight={200}
          fill={"999"}
          shadowBlur={10}
          fontFamily={"Poppins"}
          shadowColor={"#000a"}
          text={"8bit"}
          width={800}
          textAlign={"right"}
        />
      </Glass>
    </Glass>
  ) as Glass;

  view.add(gpr);
  yield* waitFor(0.5);
  yield* all(
    list.childAs<Txt>(1).opacity(0.5, 0.3),
    list.childAs<Txt>(3).opacity(0.5, 0.3),
    list.childAs<Ray>(2).end(1, 1),
    list.childAs<Ray>(6).end(1, 1)
  );

  yield* waitUntil("show register");
  yield* all(
    gpr.scale(2, 1),
    list.x(2500, 1),
    list.scale(0.5, 1),
    sequence(0.3, ACC_ref().scale(1, 1), IR_ref().scale(1, 1))
  );

  yield* waitUntil("acc");
  yield* all(
    ACC_ref()
      .findFirst((instance) => instance instanceof Txt)
      .text("ACC: 0011 0010", 0.8),
    ACC_ref().fill("#0ff4", 1).to("#fff1", 1)
  );

  yield* waitUntil("code");
  code().fontSize(80);

  /**
   * ADD  ACC, #5       ; Add 5 to accumulator
SHR  ACC           ; Shift accumulator right (divide by 2)
STORE ACC, [0x11]  ; Store accumulator result into memory address 0x11
   */

  code().selection(DEFAULT);
  yield* all(
    gpr.scale(1, 1),
    gpr.y(500, 1),
    code_container.x(0, 1),
    code_container.y(-350, 1),
    code_container.size([3200, 400], 1),
    code().code(
      `\
;Steps to perform: (3 + 5) / 2;
LOAD 0x02 ; Load number 3 from memory address 0x10 into accumulator`,
      1
    ),
    IR_ref().childAs<Txt>(0).text(" IR : 0010 0010", 1), // ir should become LOAD 0x10, ( show byte )
    ACC_ref().childAs<Txt>(0).text("ACC : 0000 0011", 1) // acc should become 3 (show byte)
  );

  yield* waitUntil("increment");
  yield* all(
    code().code(
      `\
;Steps to perform: (3 + 5) / 2;
LOAD 0x02 ; Load number 3 from memory address 0x10 into accumulator
ADD  5 ; Add 5 to accumulator`,
      1
    ),
    IR_ref().childAs<Txt>(0).text(" IR : 0100 0101", 1),
    ACC_ref().childAs<Txt>(0).text("ACC : 0000 1000", 1), // 8
    code_container.height(code_container.height() + 100, 1)
  );

  yield* waitUntil("shift");
  yield* all(
    code().code(
      `\
;Steps to perform: (3 + 5) / 2;
LOAD 0x02 ; Load number 3 from memory address 0x10 into accumulator
ADD  5 ; Add 5 to accumulator
SHR  1 ; Shift accumulator right by 1 (divide by 2)`,
      1
    ),
    IR_ref().childAs<Txt>(0).text(" IR : 11110010", 1),
    ACC_ref().childAs<Txt>(0).text("ACC : 00000100", 1),
    code_container.height(code_container.height() + 100, 1)
  );

  yield* waitUntil("store");
  yield* all(
    code().code(
      `\
;Steps to perform: (3 + 5) / 2;
LOAD 0x02 ; Load number 3 from memory address 0x10 into accumulator
ADD  5 ; Add 5 to accumulator
SHR  1 ; Shift accumulator right by 1 (divide by 2)
STORE 0x11  ; Store accumulator result into memory address 0x11`,
      1
    ),
    IR_ref().childAs<Txt>(0).text(" IR : 00110001", 1),
    ACC_ref().childAs<Txt>(0).text("ACC : 00000100", 1),
    code_container.height(code_container.height() + 100, 1)
  );

  yield* waitUntil("pc");
  yield all(
    code_container.scale(0.2, 1),
    code_container.x(-2500, 1, easeInCubic),
    gpr.y(2000, 1, easeInCubic)
  );
  yield* waitFor(0.2);
  yield* all(
    camera.lookTo(
      level1_cpu.pc.getGlobalPosition().add(new Vector3(-0.02, 0, 0.01)),
      2
    ),
    camera.zoomIn(3, 2, easeInOutCubic)
  );
  yield* waitUntil("program");
  yield* level1_cpu.pc.rotateTo(
    new Vector3(0, 0, Math.PI * 2),
    1.5,
    easeInOutSine
  );
  yield sequence(
    0.8,
    level1_cpu.wire_pc_mc.currentFlow(1, easeInOutCubic, 100),
    level1_cpu.wire_mc_ram_address.currentFlow(1, easeInOutSine, 100)
  );
  yield* all(camera.lookTo(level1_cpu.ram.getGlobalPosition(), 3));

  yield* waitUntil("next");
});
