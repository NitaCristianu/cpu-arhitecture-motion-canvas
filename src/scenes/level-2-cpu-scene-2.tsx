import {
  Camera,
  CODE,
  Code,
  Gradient,
  Icon,
  Layout,
  Line,
  lines,
  makeScene2D,
  Node,
  Ray,
  Rect,
  Txt,
  Video,
} from "@motion-canvas/2d";
import { buildCPULevel2, FLAG_DEFS } from "../utils/cpus/buildCPULevel2";
import { createScene } from "../components/presets";
import {
  all,
  chain,
  Color,
  createRef,
  createRefArray,
  createSignal,
  DEFAULT,
  delay,
  easeInBack,
  easeInCubic,
  easeInOutBack,
  easeInOutCirc,
  easeInOutCubic,
  easeInOutElastic,
  easeInOutExpo,
  easeInOutSine,
  easeInSine,
  easeOutBack,
  easeOutCubic,
  loop,
  range,
  run,
  sequence,
  useRandom,
  Vector2,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { Layers, Vector3 } from "three";
import { Label3D } from "../components/Label3D";
import { buildCPULevel1 } from "../utils/cpus/buildCPULevel1";
import { Glass } from "../components/GlassRect";
import { ShaderBackground } from "../components/background";
import Scene3D from "../libs/Thrash/Scene";
import { Switch } from "../components/switch";
import { Bitnumber } from "../utils/bitnumber";
import { AsmHighlighter } from "../utils/AsmHighlighter";
import COLORS from "../utils/colors";

const PROGRAM = CODE`\
; Program: Calculate (3 + 5) * 2, then decrement to 10

LOAD   R0, 3        ; R0 = 3
LOAD   R1, 5        ; R1 = 5
ADD    R0, R1       ; R0 = R0 + R1 → 8

LOAD   R2, 2        ; R2 = 2
MUL    R0, R2       ; R0 = R0 * R2 → 16

STORE  R0, 0x20     ; Save 16 into memory[0x20]

CMP    R0, R1       ; Compare R0 with R1 (16 vs 5)
BRGT   0x40         ; If greater, jump to address 0x40

NOP                 ; placeholder instruction

DEC    R0           ; R0 = R0 - 1 → 15
DEC    R0           ; R0 = 14
DEC    R0           ; R0 = 13
DEC    R0           ; R0 = 12
DEC    R0           ; R0 = 11
DEC    R0           ; R0 = 10

STORE  R0, 0x21     ; Save 10 into memory[0x21]
HLT                 ; End program`;

export default makeScene2D(function* (view) {
  const generator = useRandom(3);

  const scene = createScene(new Vector3(-1.5, 0.6, 1.2));
  const level1_cpu = buildCPULevel1(scene);
  const level2_cpu = buildCPULevel2(scene);

  const camera = scene.getCameraClass();

  view.add(scene);

  yield* waitUntil("begin");
  yield level1_cpu.container.moveBack(5, 0);
  yield* level2_cpu.group.popIn(0, new Vector3(1, 1, 1));
  const flags = [
    level2_cpu.flags.Z,
    level2_cpu.flags.N,
    level2_cpu.flags.V,
    level2_cpu.flags.DZ,
  ];
  yield* all(...flags.map((flag) => flag.moveDOWN(5, 0)));
  yield* all(...flags.map((flag) => flag.moveForward(0.1, 0)));
  yield* all(level1_cpu.group.popIn(0), level1_cpu.ram.popIn(0, RAM_SCALE));
  yield* level1_cpu.initWires(level1_cpu.wires, 0);

  yield* camera.lookTo(
    level2_cpu.flags.V.getGlobalPosition().add(new Vector3(0.02, +0.08, 0)),
    0
  );
  yield* camera.moveTo(
    level1_cpu.alu.getGlobalPosition().clone().add(new Vector3(0.05, 0.5, 0.5)),
    0
  );
  yield* waitUntil("flags");
  yield all(...flags.map((flag) => flag.moveBack(0.1, 1)));
  yield camera.zoomIn(1.5, 4, easeInOutCubic);
  yield* waitFor(1);
  yield loop(4, () =>
    sequence(
      0.2,
      chain(
        level2_cpu.flags.set("Z", 0.4),
        waitFor(0.1),
        level2_cpu.flags.clear("Z", 0.4)
      ),
      chain(
        level2_cpu.flags.set("N", 0.4),
        waitFor(0.1),
        level2_cpu.flags.clear("N", 0.4)
      ),
      chain(
        level2_cpu.flags.set("V", 0.4),
        waitFor(0.1),
        level2_cpu.flags.clear("V", 0.4)
      ),
      chain(
        level2_cpu.flags.set("DZ", 0.4),
        waitFor(0.1),
        level2_cpu.flags.clear("DZ", 0.4)
      )
    )
  );
  yield* waitUntil("communicate");
  yield all(
    camera.lookTo(
      level2_cpu.flags.V.getGlobalPosition().add(new Vector3(-0.1, 0, 0)),
      2
    ),
    camera.moveTo(
      level1_cpu.alu
        .getGlobalPosition()
        .clone()
        .add(new Vector3(-0.2, 0.5, 0.5)),
      1
    )
  );
  yield* waitFor(1);
  yield* loop(2, () =>
    chain(
      level1_cpu.wire_cu_iu.currentFlow(0.5, easeInOutSine, 40),
      waitFor(0.5),
      level1_cpu.wire_cu_iu.reverseFlow(0.5, easeInOutSine, 40),
      waitFor(0.5)
    )
  );

  yield* waitUntil("GPR");
  const vr_ref = createRef<Glass>();
  const ar_ref = createRef<Glass>();
  const registers = createRefArray<Glass>();
  const register_contents = (
    <Glass
      size={[1050, 600]}
      position={[300, -400]}
      scale={0}
      rotation={45}
      skew={[-40, 30]}
      translucency={1}
      borderModifier={-0.5}
    >
      <Txt
        zIndex={1}
        fontSize={120}
        fontWeight={400}
        fill={new Color("#eee").brighten(4)}
        shadowBlur={10}
        shadowColor={"#000a"}
        text={"GPR CONTENT"}
        fontFamily={"Poppins"}
        y={-180}
      />
      <Rect
        width={800}
        key="line-gpr"
        height={5}
        fill={new Color("#eee").brighten(4)}
        zIndex={1}
        y={-100}
        radius={100}
      />
      <Glass
        width={900}
        height={130}
        zIndex={1}
        y={30}
        translucency={1}
        borderModifier={-1}
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
          text={"IR: 0100 1000"}
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
        translucency={1}
        borderModifier={-1}
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
          text={"ACC: 0001 1110"}
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
  view.add(register_contents);
  registers.push(vr_ref());
  registers.push(ar_ref());

  const diff = vr_ref().y() - ar_ref().y();
  const clones = range(4).map((i) => {
    const clone = vr_ref().clone({
      y: vr_ref().y() + (i + 1) * diff,
      scale: 0,
      translucency: 1,
      borderModifier: -1,
    });
    registers.push(clone);
    clone.childAs<Txt>(0).text(`R${i + 1}: 0001 0010`);
    register_contents.add(clone);
    return clone;
  });
  // clones.forEach((c) => c.add(register_contents.add(c)));

  yield delay(
    1,
    chain(
      all(
        register_contents.scale(1, 1, easeOutCubic),
        register_contents.rotation(0, 1, easeOutCubic),
        register_contents.skew(0, 1, easeOutCubic),
        register_contents.x(-1200, 1, easeOutCubic),
        register_contents.y(200, 1, easeOutCubic)
      ),
      ar_ref().scale(1, 0.5, easeOutBack),
      vr_ref().scale(1, 0.5, easeOutBack),
      all(
        run(function* () {
          yield* all(
            register_contents.height(register_contents.height() + 800, 1),
            ...register_contents
              .children()
              .map((c, i) =>
                c.children().length > 0 || c.key == "line-gpr"
                  ? all(c.y(c.y() - 350, 1))
                  : null
              ),
            vr_ref().childAs<Txt>(0).text("R0: 0010 0010", 1),
            register_contents.y(register_contents.y() - 250, 1),
            sequence(0.2, ...clones.map((cl: Rect) => cl.scale(1, 1)))
          );
        })
      )
    )
  );
  yield* all(
    camera.lookTo(
      level1_cpu.gpr.getGlobalPosition().add(new Vector3(0.04, -0.05, 0)),
      2
    ),
    camera.moveTo(
      level1_cpu.alu
        .getGlobalPosition()
        .clone()
        .add(new Vector3(0.4, 0.7, 0.3)),
      2
    ),
    camera.zoomOut(0.8, 1)
  );
  yield* level1_cpu.wire_cu_gpr.widthTo(5, 0);
  yield* level1_cpu.wire_cu_gpr.popInDraw(1);

  yield* waitFor(1);
  yield* waitUntil("Freedom");
  yield* sequence(
    0.05,
    all(
      register_contents.strokeRect().lineWidth(0, 1),
      register_contents.translucency(0, 1),
      register_contents.findFirst((node) => node instanceof Txt).scale(0.4, 1),
      register_contents.findFirst((node) => node instanceof Txt).opacity(0, 1),
      (
        register_contents.findFirst((node) => node.key == "line-gpr") as Rect
      ).end(0, 1)
    ),
    ...registers.map((register, i) =>
      all(
        register.absolutePosition(() => {
          var center = view.position();
          var newI = i;
          if (i == 0) newI = 1;
          if (i == 1) newI = 0;
          var x = newI < 3 ? -800 : +800; 
          var y = (newI % 3) * 300 - 600 / 2;

          return center.add([x, y]);
        }, 1),
        register.scale(1.6, 1)
      )
    )
  );

  yield* waitUntil("code");
  const code = (
    <Glass size={[2600, 2700]} translucency={1} borderModifier={-1} y={3000}>
      <Code
        zIndex={1}
        fontSize={80}
        width={1800}
        top={[0, -20]}
        height={600}
        highlighter={new AsmHighlighter()}
        code={PROGRAM}
      />
    </Glass>
  ) as Glass;
  view.add(code);

  const coderange = createSignal(() => {
    const range = code.childAs<Code>(0).findFirstRange("STORE  R0, 0x20");
    const bboxes = code.childAs<Code>(0).getSelectionBBox(range);
    // "getSelectionBBox" returns an array of bboxes,
    // one for each line in the range. You can just
    // use the first one for this example.
    const first = bboxes[0];
    return first.expand([8, 16]);
  });

  const code_highlight = createRef<Rect>();
  code.childAs<Code>(0).add(
    <Rect
      end={0}
      ref={code_highlight}
      offset={-1}
      position={coderange().position}
      size={coderange().size}
      lineWidth={3}
      fill={"#fff2"}
      stroke={
        new Gradient({
          from: new Vector2(100, 200),
          to: new Vector2(-100, 0),
          stops: [
            {
              offset: 0,
              color: "#fff5",
            },
            {
              offset: 1,
              color: "#fff",
            },
          ],
        })
      }
      radius={8}
    />
  );

  yield code.y(1000, 5, easeOutCubic);
  yield* sequence(
    0.05,
    ...registers.map((register, i) =>
      all(
        register.absolutePosition(
          () => {
            var center = view.position();
            var newI = i;
            if (i == 0) newI = 1;
            if (i == 1) newI = 0;
            var x = newI < 3 ? -200 : 200; // skip 2 elements
            var y = (newI % 3) * 300 - 600 / 2 + 900;

            return center.add([x, y]);
          },
          1,
          easeInOutBack
        ),
        register.scale(0, 1, easeInBack)
      )
    )
  );

  yield* waitUntil("double");
  yield* all(
    code.scale(3.2, 2, easeInOutExpo),
    code.x(2000, 2, easeInOutExpo),
    delay(1, code_highlight().end(1, 1))
  );

  yield* waitUntil("next");
});
