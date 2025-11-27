import { Code, Icon, Layout, makeScene2D, Txt } from "@motion-canvas/2d";
import { createScene } from "../components/presets";
import { buildCPULevel0, RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { buildCPULevel1 } from "../utils/cpus/buildCPULevel1";
import { buildCPULevel2 } from "../utils/cpus/buildCPULevel2";
import { Vector3 } from "three";
import {
  all,
  any,
  chain,
  createRef,
  createRefArray,
  createSignal,
  delay,
  easeInBack,
  easeInCubic,
  easeInElastic,
  easeInOutCubic,
  easeInOutSine,
  easeOutBack,
  easeOutCubic,
  easeOutElastic,
  loop,
  Reference,
  run,
  sequence,
  SimpleSignal,
  spawn,
  useRandom,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { Label3D, LabelColorKey } from "../components/Label3D";
import Model from "../libs/Thrash/objects/Model";
import { Bitnumber } from "../utils/bitnumber";
import Object from "../libs/Thrash/utils/Object";
import { GlowPanelTitle } from "../components/TextPresets";
import { triggerConfetti } from "../libs/Thrash/components/ConfettiBurst";
import Mesh from "../libs/Thrash/objects/Mesh";
import { Glass } from "../components/GlassRect";
import { AsmHighlighter } from "../utils/AsmHighlighter";

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(1.5, 0.4, 1.5));
  const camera = scene.getCameraClass();

  const generator = useRandom();

  const cpus = [
    buildCPULevel0(scene),
    buildCPULevel1(scene),
    buildCPULevel2(scene),
  ];

  // Speed up animation timings for this intro.
  const timeScale = 0.3;
  const fast = (duration: number) => duration * timeScale;

  cpus.forEach((cpu, i) => cpu.container.core.position.set(i * 1.5, 0, 0));

  const cpu0 = cpus[0];
  const nonRamWires = cpu0.wires.filter(
    (wire) => wire != cpu0.wire_mc_ram_address && wire != cpu0.wire_mc_ram_data
  );
  const ramBus = [cpu0.wire_mc_ram_address, cpu0.wire_mc_ram_data];
  const counter = createSignal(1);
  // De-emphasize RAM and its buses
  cpu0.ram.localScale(cpu0.ram.localScale().clone().multiplyScalar(0.15));
  cpu0.ram.localPosition(
    cpu0.ram.localPosition().clone().add(new Vector3(0, -0.18, 0))
  );
  ramBus.forEach((wire) => wire.lineWidth(0.8));

  const cursor = new Model({
    key: "clock-hand",
    src: "/models/cursor.glb",
    localRotation: new Vector3(-0.4, 0.3, 0.7),
    localScale: new Vector3(1, 1, 0.2).multiplyScalar(0.15),
    localPosition: cpu0.clock
      .getGlobalPosition()
      .clone()
      .add(new Vector3(-0.35, 2.47, 0.22)),
  });
  scene.add(cursor);
  scene.init();
  view.add(scene);

  const titleLabel = new Label3D({
    text: "LEVEL 0 CPU",
    color: "control",
    scene,
    width: 800,
    fontSize: 90,
    worldPosition: () =>
      cpu0.base.getGlobalPosition().clone().add(new Vector3(0, 0.15, 0)),
    offset2D: [0, -1100],
  });

  const counterLabel = new Label3D({
    text: () => counter().toFixed(0),
    color: "memory",
    scene,
    width: 520,
    height: 360,
    radius: 64,
    translucency: 0.2,
    fontSize: 200,
    worldPosition: () =>
      cpu0.base.getGlobalPosition().clone().add(new Vector3(0, 0.05, 0)),
    offset2D: [0, -1000],
  });
  counterLabel.add(
    <Txt
      y={130}
      fill={"#fffa"}
      fontFamily={"Poppins"}
      fontSize={60}
      fontWeight={500}
      text={"fixed address"}
      shadowBlur={20}
      shadowColor={"#fff6"}
    />
  );
  view.add(titleLabel);
  view.add(counterLabel);

  let busPrimed = false;
  const busFlow = function* () {
    if (!busPrimed) {
      busPrimed = true;
      yield* all(
        ...ramBus.map((wire) => wire.widthTo(0.8, fast(0.2), easeOutCubic))
      );
    }
    yield* all(
      cpu0.wire_gpr_mc.reverseFlow(fast(0.35), easeInOutCubic, 140),
      ...ramBus.map((wire) => wire.currentFlow(fast(0.35), easeInOutCubic, 40))
    );
  };

  const pressClock = function* (flow?: any) {
    yield* any(
      cpu0.clock.childAs<Model>(0).moveForward(0.3, fast(0.8), easeInElastic),
      cursor.moveDOWN(0.01, fast(1), easeInCubic)
    );
    if (flow) {
      yield* flow();
    }
    yield* all(
      cpu0.clock.childAs<Model>(0).moveBack(0.3, fast(0.5), easeOutElastic),
      cursor.moveUP(0.01, fast(0.8), easeOutBack)
    );
  };

  const tickOnce = function* (
    valueStep = 1,
    includeBus = false,
    cameraOffset: Vector3 | null = null
  ) {
    const camTween = cameraOffset
      ? all(
          camera.moveTo(
            camera.localPosition().clone().add(cameraOffset),
            fast(0.6),
            easeOutCubic
          )
        )
      : waitFor(fast(0.6));

    yield* all(
      pressClock(() =>
        sequence(
          fast(0.07),
          cpu0.wire_clock_cu.currentFlow(fast(1), easeInOutCubic, 100),
          cpu0.wire_cu_iu.currentFlow(fast(0.28), easeInOutCubic, 140),
          all(
            cpu0.wire_gpr_iu.reverseFlow(fast(0.28), easeInOutCubic, 140),
            cpu0.wire_iu_mc.currentFlow(fast(0.28), easeInOutCubic, 140)
          ),
          includeBus
            ? busFlow()
            : cpu0.wire_gpr_mc.reverseFlow(fast(0.28), easeInOutCubic, 140),
          counter(counter() + valueStep, fast(0.32), easeOutBack)
        )
      ),
      camTween
    );
  };

  yield* waitUntil("begin");
  yield* all(
    ...cpus.map((cpu) => cpu.group.popIn()),
    // cpu0.ram.popIn(fast(0.5), RAM_SCALE.clone().multiplyScalar(0.15)),
    camera.lookTo(cpu0.base.getGlobalPosition(), fast(1.1))
  );
  yield* cpu0.initWires(nonRamWires);
  yield* cursor.moveDOWN(2.4, fast(1));
  yield* sequence(fast(0.05), titleLabel.popIn(), counterLabel.popIn());

  yield* tickOnce(1, true, new Vector3(-0.25, 0.0, -0.28));
  yield* tickOnce(1, false, new Vector3(0.2, 0.0, -0.24));
  yield* tickOnce(1, false, new Vector3(-0.28, 0.0, 0.26));
  yield* tickOnce(1, false, new Vector3(-0.28, 0.0, 0.26));
  yield* tickOnce(1, false, new Vector3(-0.28, 0.0, 0.26));
  yield* waitFor(fast(0.35));

  yield* waitUntil("level 1 CPU");

  yield* all(
    camera.moveRight(2, 2, easeInOutCubic),
    camera.lookRight(1.5, 2, easeInOutCubic)
  );
  const level1Label = new Label3D({
    text: "LEVEL 1 CPU",
    color: "sky",
    scene,
    width: 800,
    fontSize: 90,
    worldPosition: () =>
      cpus[1].base.getGlobalPosition().clone().add(new Vector3(0, 0.15, 0)),
    offset2D: [0, -1100],
  });

  const program_counter = createRef<Label3D>();
  const instruction_register = createRef<Label3D>();
  const accumulator = createRef<Label3D>();
  const ACC = createSignal(0);
  const PC = createSignal(12); // 12 is the start
  const IR = createSignal(0);
  const PANELS_Y = 450;

  const createLabel = (
    object: Object,
    main: Reference<Label3D>,
    value: SimpleSignal<number>,
    color: LabelColorKey,
    title: string
  ) => {
    const bits = createRef<Bitnumber>();
    view.add(
      <Label3D
        scene={scene}
        worldPosition={() => object.getGlobalPosition()}
        text={""}
        width={950}
        height={250}
        zIndex={1}
        ref={main}
        offset2D={[0, -PANELS_Y]}
        color={color}
        translucency={0.4}
        lightness={-3}
        borderModifier={-1}
      >
        <GlowPanelTitle zIndex={1} text={title} scale={0.5} y={-65} />
        <Bitnumber
          number={value}
          initialVisibility
          y={50}
          bitgroups={2}
          scale={0.65}
          zIndex={1}
          x={-25 - 12}
          ref={bits}
        />
      </Label3D>
    );

    return (val: number) => {
      value(val);
      bits().load(val);

      spawn(main().scale(main().scale().mul(1.1), 0.8).back(0.8));
    };
  };

  const updatePC = createLabel(
    (cpus[1] as any).pc,
    program_counter,
    PC,
    "alu",
    "Program Counter (PC)"
  );
  const updateIR = createLabel(
    (cpus[1] as any).ir,
    instruction_register,
    IR,
    "bus",
    "Instruction Register (IR)"
  );
  const updateACC = createLabel(
    cpus[1].gpr,
    accumulator,
    ACC,
    "control",
    "Accumulator (ACC)"
  );

  const convertInstruction = (mnemonic: string, operand: number) => {
    const INS = [
      "NOP",
      "HLT",
      "LOAD",
      "STORE",
      "ADD",
      "SUB",
      "MUL",
      "DIV",
      "INC",
      "AND",
      "OR",
      "XOR",
      "NOT",
      "SHL",
      "SHR",
      "JMP",
    ];

    const opcode = INS.indexOf(mnemonic.toUpperCase());
    if (opcode === -1) throw new Error("Invalid instruction");
    if (operand < 0 || operand > 15)
      throw new Error("Operand out of range (0–15)");

    // (opcode << 4) | operand
    return (opcode << 4) | operand;
  };

  const INSTRUCTIONS = [
    convertInstruction("LOAD", 1),
    convertInstruction("SHR", 1),
    convertInstruction("ADD", 1),
    convertInstruction("JMP", 14),
  ];
  function* loadRegisters(index: number) {
    yield* sequence(
      0.7,
      all(
        cpus[1].wire_clock_cu.currentFlow(0.5, easeInOutSine, 60),
        cpus[1].clock.pulse(1.05, 1)
      ),
      all(
        (cpus[1] as any).wire_mc_ir_margin.currentFlow(1, easeInOutSine, 60),
        (cpus[1] as any).wire_pc_mc.reverseFlow(1, easeInOutSine, 60),
        (cpus[1] as any).wire_clock_cu.currentFlow(0.5, easeInOutSine, 60),

        run(function* () {
          yield* waitFor(0.5);
          updatePC(index + 12);
          updateIR(INSTRUCTIONS[index % INSTRUCTIONS.length]);
          updateACC(generator.nextInt());
        })
      ),
      all(
        (cpus[1] as any).wire_ir_cu.currentFlow(1, easeInOutSine, 60),
        (cpus[1] as any).wire_cu_pc.reverseFlow(1, easeInOutSine, 60)
      )
    );
  }

  view.add(level1Label);
  yield* level1Label.popIn();
  yield* cpus[1].initWires(
    cpus[1].wires.filter(
      (w) => w != cpus[1].wire_mc_ram_address && w != cpus[1].wire_mc_ram_data
    )
  );
  yield camera.moveForward(3, 8, easeInOutCubic);

  yield* all(
    program_counter().offset2D([630, -450], 1),
    program_counter().popIn(1),
    instruction_register().offset2D([-600, -500], 1),
    instruction_register().popIn(1),
    accumulator().offset2D([0, -700], 1),
    accumulator().popIn(1)
  );

  yield loop(() =>
    chain(
      loadRegisters(3),
      loadRegisters(2),
      sequence(
        0.7,
        all(
          cpus[1].wire_cu_iu.currentFlow(1, easeInOutSine, 60),
          cpus[1].wire_clock_cu.currentFlow(0.5, easeInOutSine, 60)
        ),
        all(
          cpus[1].wire_clock_cu.currentFlow(0.5, easeInOutSine, 60),
          cpus[1].wire_gpr_iu.reverseFlow(1, easeInOutSine, 60)
        ),
        run(function* () {
          updateACC(ACC() + 1);
        })
      )
    )
  );
  yield* waitUntil("dissapear labels");
  yield* all(
    accumulator().popOut(),
    program_counter().popOut(),
    instruction_register().popOut()
  );

  yield* waitUntil("level 2 CPU");
  yield* all(
    camera.moveRight(2, 2, easeInOutCubic),
    camera.lookRight(1.5, 2, easeInOutCubic)
  );
  const level2Label = new Label3D({
    text: "LEVEL 2 CPU",
    color: "sky",
    scene,
    width: 800,
    fontSize: 90,
    worldPosition: () =>
      cpus[2].base.getGlobalPosition().clone().add(new Vector3(0, 0.15, 0)),
    offset2D: [0, -1000],
  });
  view.add(level2Label);
  yield* level2Label.popIn();
  const wireless_arr = cpus[2].wires.filter(
    (w) => w != cpus[2].wire_mc_ram_address && w != cpus[2].wire_mc_ram_data
  );
  yield* cpus[2].initWires(wireless_arr);

  const level2Features = [
    {
      time: "04:32",
      text: "Complex instructions",
    },
    {
      time: "04:36",
      text: "Loops, branching, conditions",
    },
    {
      time: "04:40",
      text: "and who knows what?",
    },
  ];
  const featurePanelRef = createRef<Glass>();
  const featureTitle = createRef<GlowPanelTitle>();
  const featureLines = createRefArray<Txt>();
  const codeHeader = createRef<Layout>();
  const codeIcon = createRef<Icon>();
  const codeBlock = createRef<Code>();
  const debugStub = `\
GRT0 R0, [0xf20] ; jmp to f20 if > 0
JMP [0xf21] ; otherwise skip to f21
ADD R0, #1; here is 0xf20
HLT ; here is f21
`;
  const featurePanel = (
    <Glass
      width={1200}
      height={600}
      y={640}
      translucency={1}
      lightness={0.5}
      borderModifier={0.3}
      scale={0}
      zIndex={3}
      x={-1350}
      ref={featurePanelRef}
    >
      <GlowPanelTitle
        ref={featureTitle}
        zIndex={1}
        text={"Level 2 Highlights"}
        fontSize={110}
        y={-180}
      />
      {level2Features.map((line, idx) => (
        <Txt
          ref={featureLines}
          text={`${(idx + 1).toFixed(0)}. ${line.text}`}
          fontFamily={"Poppins"}
          fontWeight={500}
          fontSize={64}
          zIndex={1}
          fill={"#e8f4ff"}
          shadowBlur={25}
          shadowColor={"#0a2468"}
          y={-40 + idx * 110}
        />
      ))}
      <Layout
        ref={codeHeader}
        layout
        gap={24}
        y={-300}
        opacity={0}
        scale={0}
        zIndex={2}
        alignItems={"center"}
        justifyContent={"center"}
      >
        <Icon
          ref={codeIcon}
          icon={"mdi:chip"}
          color={"#c7ebff"}
          size={90}
          shadowBlur={25}
          shadowColor={"#0a2468"}
        />
        <GlowPanelTitle
          zIndex={1}
          text={"L2 CPU Code Sample"}
          fontSize={100}
        />
      </Layout>
      <Code
        ref={codeBlock}
        opacity={0}
        scale={0}
        zIndex={1}
        y={80}
        width={1100}
        height={450}
        fontSize={64}
        fontFamily={"Fira Code"}
        highlighter={new AsmHighlighter()}
        code={debugStub}
      />
    </Glass>
  ) as Glass;
  view.add(featurePanel);

  yield* waitUntil("support list");
  yield* all(
    camera.moveTo(
      cpus[2].base
        .getGlobalPosition()
        .clone()
        .add(new Vector3(0.1, 1.3, -0.01)),
      2
    ),
    delay(1, level2Label.popOut())
  );
  yield* all(featurePanel.scale(1, 0.6, easeOutBack));
  const objs = [
    (cpus[2] as any).ram,
    (cpus[2] as any).cu,
    (cpus[2] as any).alu,
    (cpus[2] as any).mc,
    (cpus[2] as any).gpr,
    (cpus[2] as any).ir,
    (cpus[2] as any).pc,
    (cpus[2] as any).clock,
    (cpus[2] as any).decode,
  ];
  yield loop(() =>
    all(
      sequence(
        0.2,
        wireless_arr[generator.nextInt(0, wireless_arr.length)].currentFlow(
          0.3,
          easeInOutSine,
          100
        ),
        (objs[generator.nextInt(0, objs.length)] as Mesh).pulse()
      ),

      sequence(
        0.2,
        wireless_arr[generator.nextInt(0, wireless_arr.length)].currentFlow(
          0.3,
          easeInOutSine,
          100
        )
      )
    )
  );
  yield chain(
    camera.moveTo(
      camera.localPosition().clone().add(new Vector3(1, -.2, 1)),
      7
    )
  );

  yield* waitUntil("code panel");
  yield* sequence(
    0.04,
    ...featureLines.map((line) =>
      all(line.opacity(0, 0.35, easeInCubic), line.y(line.y() + 40, 0.35))
    ),
    featureTitle().opacity(0, 0.4, easeInCubic)
  );
  yield* all(
    featurePanelRef().width(1500, 0.7, easeInOutCubic),
    featurePanelRef().height(820, 0.7, easeInOutCubic),
    featurePanelRef().x(1050, 0.7, easeInOutCubic),
    featurePanelRef().y(0, 0.7, easeInOutCubic),
    featurePanelRef().scale(1.05, 0.7, easeOutBack)
  );
  yield* all(
    codeHeader().opacity(1, 0.6, easeOutCubic),
    codeHeader().scale(1, 0.6, easeOutBack),
    codeIcon().rotation(0.1, 0.6, easeOutBack)
  );
  yield* all(
    codeBlock().opacity(1, 0.6, easeOutCubic),
    codeBlock().scale(1, 0.6, easeOutBack)
  );

  yield* waitUntil("next");
});
