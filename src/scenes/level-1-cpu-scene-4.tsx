import {
  Circle,
  Code,
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
  Color,
  createRef,
  createRefArray,
  createSignal,
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

export default makeScene2D(function* (view: View2D) {
  view.fill("#000");
  // 3D SCENE
  const scene = createScene(new Vector3(-1.5, 1, 1.5));
  const level0_cpu = buildCPULevel0(scene);
  const level1_cpu = buildCPULevel1(scene);
  const alu = new Box({
    material: new MeshPhysicalMaterial({
      color: 0x00a0ff,
      metalness: 0.5,
    }),
    localScale: new Vector3(0, 0, 0),
    localPosition: level0_cpu.iu
      .getGlobalPosition()
      .add(new Vector3(0, 0, 0.1)),
    localRotation: new Vector3(0, 0, Math.PI / 2),
  });
  scene.add(alu);

  view.add(scene);
  scene.init();

  // TIMELINE
  yield level0_cpu.iu.moveDOWN(3, 0);

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
  yield* alu.popIn(0.5, new Vector3(0.02, 0.18, 0.13));
  yield* level0_cpu.initWires();

  yield* waitUntil("transition");
  yield* scene.opacity(0, 0.3);
  const t = (
    <Txt
      fontFamily={"Poppins"}
      fontWeight={600}
      fontSize={300}
      fill="yellow"
      shadowBlur={130}
      shadowColor={"ffff003a"}
    />
  ) as Txt;
  view.add(t);
  yield* t.text("Step 2. Workflow", 1);
  yield* level1_cpu.initWires(level1_cpu.wires);
  yield* all(
    level0_cpu.container.moveDOWN(1000, 0),
    alu.moveDOWN(1000, 0),
    level1_cpu.group.popIn(0.4),
    level1_cpu.ram.popIn(0.4, RAM_SCALE)
  );
  yield* waitFor(0.3);
  yield* scene.opacity(1, 0.3);
  yield* all(t.opacity(0, 1));
  yield* waitUntil("look");
  yield* chain(
    all(camera.lookTo(level1_cpu.ir.getGlobalPosition()), camera.zoomIn(1.5)),
    all(camera.lookTo(level1_cpu.pc.getGlobalPosition())),
    all(
      camera.lookTo(level1_cpu.base.getGlobalPosition(), 1.5),
      camera.zoomOut(1 / 1.5, 1.5, easeInOutCubic)
    )
  );

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
          stroke={'white'}
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
    </Glass>
  );
  view.add(list);
  list.save();
  list.x(2500);
  list.scale(0.5);

  yield* waitUntil("list");
  yield* list.restore(1, easeOutCubic);

  yield* waitFor(0.5);
  yield* all(
    list.childAs<Txt>(1).opacity(0.5, 0.3),
    list.childAs<Txt>(4).opacity(0.5, 0.3),
    list.childAs<Ray>(2).end(1,1),
  );

  yield* waitUntil("addreses");
  yield* all(camera.lookTo(level1_cpu.ram.getGlobalPosition(), 1));

  const addresses_raw = ["0x05", "0xa1", "0x12", "0xf0"];
  const addreses_lbls: Label3D[] = addresses_raw.map(
    (address) =>
      (
        <Label3D
          scene={scene}
          worldPosition={level1_cpu.ram.getGlobalPosition()}
          position={new Vector2(225, -59)}
          text={address}
          width={200*1.8}
          fontSize={100}
          height={75*1.8}
          ignorePosition
        />
      ) as Label3D
  );
  addreses_lbls.forEach((a) => view.add(a));

  yield* loop(addresses_raw.length, (i) =>
    all(
      addreses_lbls[i].popIn(),
      sequence(
        0.3,
        level1_cpu.wire_mc_ram_address.reverseFlow(0.4, easeInSine, 100),
        level1_cpu.wire_mc_ir_margin.currentFlow(0.4, easeInSine, 100),
        level1_cpu.wire_ir_cu.currentFlow(0.4, easeInSine, 100)
      ),
      chain(
        addreses_lbls[i].position(new Vector2(-808, 738), 1),
        addreses_lbls[i].popOut()
      )
    )
  );

  const code = (
    <Glass
      size={[900, 500]}
      lightness={-0.5}
      borderModifier={-0.5}
      scaleY={0}
      translucency={1}
    >
      <Code y={100} code={"int VR = 2;"} zIndex={1} fontSize={120} />;
      <Code y={-100} code={"int AR = 10;"} zIndex={1} fontSize={120} />;
    </Glass>
  ) as Glass;

  const vr_ref = createRef<Glass>();
  const ar_ref = createRef<Glass>();
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
        ref={ar_ref}
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
          text={"AR: 0x0a"}
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
        ref={vr_ref}
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
  );

  view.add(gpr);
  view.add(code);

  gpr.x(3000);
  yield* waitUntil("code");
  yield* all(
    list.x(2550, 1),
    list.scale(0.5, 1),
    code.scale(1, 1, easeOutBack)
  );
  yield* all(gpr.x(1300, 1), gpr.scale(1, 1));
  yield* sequence(
    0.2,
    sequence(
      0.3,
      code
        .childAs<Code>(0)
        .position(
          vr_ref().position().add(vr_ref().parent().position()),
          1,
          easeInOutSine
        ),
      delay(
        0.2,

        all(
          code.childAs<Code>(0).scale(0, 0.6),
          code.childAs<Code>(0).opacity(0, 0.6)
        )
      ),
      vr_ref().scale(1, 0.5, easeOutBack)
    ),
    sequence(
      0.3,
      code
        .childAs<Code>(1)
        .position(
          ar_ref().position().add(ar_ref().parent().position()),
          1,
          easeInOutSine
        ),
      delay(
        0.2,

        all(
          code.childAs<Code>(1).scale(0, 0.6),
          code.childAs<Code>(1).opacity(0, 0.6)
        )
      ),
      ar_ref().scale(1, 0.5, easeOutBack)
    ),
    code.size(0, 1, easeInBack)
  );

  yield* all(gpr.scale(2, 2, easeOutBack), gpr.position(0, 1));

  yield* waitUntil("address");
  yield* all(ar_ref().fill("#0ff2", 1));
  yield* waitFor(1);
  yield* all(
    ar_ref()
      .findFirst((instance) => instance instanceof Txt)
      .text(" IR: 0000 0000", 0.4),
    ar_ref().fill("#0ff4", 1).to("#fff1", 1)
  );
  const ir = ar_ref()
    .findFirst((instance) => instance instanceof Txt)
    .clone({ scale: 2, y: 60, zIndex: 2 });
  view.add(ir);
  const black = <Rect fill={"000b19"} size={"100%"} opacity={0} />;
  const shader_background = <ShaderBackground opacity={0} />;
  view.add(black);
  view.add(shader_background);

  const questions = (
    <Rect zIndex={2} gap={250} y={150} x={-30} alignItems={"center"}>
      <Txt fill={"white"} fontSize={90} x={-240} fontFamily={"Poppins"}>
        What?
      </Txt>
      <Txt fill={"white"} fontSize={70} y={10} x={290} fontFamily={"Poppins"}>
        How/where?
      </Txt>
    </Rect>
  );
  questions.childrenAs<Txt>().forEach((child) => {
    child.save();
    child.text("");
  });
  view.add(questions);
  yield* all(
    black.opacity(1, 1),
    shader_background.opacity(0.2, 1),
    ir.scale(3, 1),
    ir.position([500, 0], 1)
  );
  yield* waitFor(0.2);
  yield* sequence(0.4, ...questions.children().map((c) => c.restore(1)));

  yield* waitUntil("byte");
  const LEVEL1_INSTRUCTIONS = [
    ["NOP", "No operation"],
    ["HLT", "Halt execution"],

    ["LOAD", "Load value from memory into ACC"],
    ["STORE", "Store ACC into memory"],

    ["ADD", "ACC = ACC + operand"],
    ["SUB", "ACC = ACC - operand"],
    ["MUL", "ACC = ACC * operand"],
    ["DIV", "ACC = ACC / operand"],

    ["INC", "Increment ACC"],

    ["AND", "Bitwise AND with ACC"],
    ["OR", "Bitwise OR with ACC"],
    ["XOR", "Bitwise XOR with ACC"],
    ["NOT", "Bitwise NOT (invert ACC)"],

    ["SHL", "ACC = ACC << operand"],
    ["SHR", "ACC = ACC >> operand"],

    ["JMP", "Jump to memory address (unconditional)"],
  ];
  const instructions = (
    <Rect
      direction={"column"}
      wrap={"wrap"}
      height={700}
      layout
      width={view.width() * 0.8}
      y={550}
      justifyContent={"center"}
      opacity={0}
      x={-100}
    >
      {...LEVEL1_INSTRUCTIONS.map((instr) => (
        <Rect
          direction={"row"}
          opacity={0.3}
          gap={30}
          justifyContent={"start"}
          alignItems={"center"}
          margin={20}
        >
          <Txt
            fill={"white"}
            fontSize={85}
            shadowBlur={30}
            shadowColor={"#fffa"}
          >
            {instr[0]}
          </Txt>{" "}
          <Txt fill={"#ddd"} fontSize={50}>
            {instr[1]}
          </Txt>
        </Rect>
      ))}
    </Rect>
  );
  view.add(instructions);

  const opcode = (<Bitnumber bitgroups={1} y={50} x={-700} />) as Bitnumber;
  const operand = (<Bitnumber bitgroups={1} y={50} x={700} />) as Bitnumber;
  view.add(opcode);
  view.add(operand);

  yield* all(
    ir.position([150, -320], 1),
    ir.text("Instruction Register (IR)", 1),
    ir.scale(3, 1),
    sequence(0.4, ...questions.children().map((c: any) => c.text(""))),
    opcode.pop(),
    opcode.scale(2, 1),
    operand.pop(),
    operand.scale(2, 1)
  );

  yield operand.opacity(0.2, 1);
  yield* all(
    ir.y(-700, 1),
    opcode.y(-150, 1),
    operand.y(-150, 1),
    instructions.opacity(1, 1)
  );
  yield* loop(LEVEL1_INSTRUCTIONS.length, (i) =>
    run(function* () {
      opcode.load(i);
      if (i > 0) {
        yield all(instructions.children()[i - 1].opacity(0.3, 0.5));
      }
      yield* all(instructions.children()[i].opacity(1, 0.5));
    })
  );
  yield operand.opacity(1, 1);

  yield* waitUntil("artihmetic");
  yield* all(
    instructions.children()[4].opacity(1, 0.5),
    instructions
      .children()
      [instructions.children().length - 1].opacity(0.3, 0.5),
    run(function* () {
      opcode.load(4), operand.load(5);
    })
  );

  const title = (
    <Txt
      fill={"#fff"}
      fontSize={80}
      shadowBlur={30}
      shadowColor={"#fff2"}
      y={100}
      x={830}
      fontWeight={200}
      opacity={0.5}
    ></Txt>
  ) as Txt;
  view.add(title);
  yield* all(
    title.text("Here the operand (0101) represents the number 5.", 0.5)
  );

  yield* waitUntil("memory");
  yield* all(
    instructions.children()[3].opacity(1, 0.5),
    instructions.children()[4].opacity(0.3, 0.5),
    run(function* () {
      opcode.load(3), operand.load(3);
    }),
    title.text("Here the operand (0101) represents the memory addres 0x03", 1)
  );

  yield* waitUntil("retrive");
  yield* all(
    ...instructions.children().map((child) => child.opacity(1, 1)),
    title.text("", 1)
  );

  
  yield* waitUntil("next");
});
