import {
  Code,
  Line,
  lines,
  makeScene2D,
  Node,
  View2D,
} from "@motion-canvas/2d";
import {
  all,
  chain,
  createRef,
  createSignal,
  DEFAULT,
  easeInOutBack,
  easeInOutSine,
  easeOutBack,
  loop,
  range,
  Reference,
  run,
  sequence,
  SignalValue,
  SimpleSignal,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { Vector3 } from "three";
import { createScene } from "../components/presets";
import Camera from "../libs/Thrash/Camera";
import { buildCPULevel1 } from "../utils/cpus/buildCPULevel1";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { Label3D, LabelColorKey } from "../components/Label3D";
import { AsmHighlighter } from "../utils/AsmHighlighter";
import {
  GlassCaption,
  GlowBadge,
  GlowPanelTitle,
} from "../components/TextPresets";
import { Bitnumber } from "../utils/bitnumber";
import Object from "../libs/Thrash/utils/Object";
import { createInfoCard } from "../utils/infocard";

export default makeScene2D(function* (view: View2D) {
  view.fill("#030710");
  const scene = createScene(new Vector3(-1.1, 0.95, 1.1));
  const cpu = buildCPULevel1(scene);
  view.add(scene);
  scene.init();

  const camera = scene.getCameraClass();

  yield* all(cpu.group.popIn(0), cpu.ram.popIn(0, RAM_SCALE));
  yield* camera.lookAt(new Vector3(0, -0.4, 0), 0);

  yield* waitUntil("begin");

  // camera goes to ram

  yield* all(
    camera.lookTo(
      cpu.ram.getGlobalPosition().add(new Vector3(0, 0, -0.065)),
      2.5,
      easeInOutSine
    ),
    camera.moveTo(
      cpu.alu.getGlobalPosition().add(new Vector3(-0.4, 0.3, -0.065)),
      2.5,
      easeInOutSine
    )
  );

  const code_sample = createRef<Code>();
  const code_frame = createRef<Label3D>();

  view.add(
    <Label3D
      scene={scene}
      worldPosition={cpu.ram
        .getGlobalPosition()
        .add(new Vector3(0, 0.15, -0.065))}
      width={1400}
      height={500}
      text={""}
      ref={code_frame}
      color="control"
      translucency={1}
      lightness={-.1}
      zIndex={90999 }
    >
      <Code
        fontSize={80}
        zIndex={1}
        width={1400}
        x={-250}
        height={500}
        highlighter={new AsmHighlighter()}
        ref={code_sample}
        code={`
LOAD [0x01]
SHR #1 ; div by 2
ADD #1
JMP [0x14]
          `}
      />
      {range(4).map((i) => (
        <Node zIndex={1}>
          <Line
            points={[
              [-650, 45],
              [650, 45],
            ]}
            opacity={0.05}
            lineCap={"round"}
            lineWidth={8}
            stroke={"white"}
            zIndex={1}
            y={i * 99 - 150}
          />
          <GlassCaption
            text={`[0x1${i + 2}]`}
            fontSize={70}
            y={i * 99 - 150}
            fill={"ddd"}
            fontFamily={"Fira Code"}
            x={500}
          />
        </Node>
      ))}
    </Label3D>
  );

  yield* code_frame().popIn(1, easeOutBack);

  // code highlight

  yield* waitUntil("div by 2");
  yield* code_sample().selection(lines(0, 2), 1), yield* waitUntil("loop");
  yield* code_sample().selection(lines(3, 4), 1), yield* waitUntil("execute");
  yield* code_sample().selection(DEFAULT, 1);

  yield* cpu.initWires([...cpu.wires]);
  yield* all(
    code_frame().offset2D([200, -300], 1, easeInOutSine),
    code_frame().scale(0.8, 1),
    camera.lookTo(
      cpu.alu.getGlobalPosition().add(new Vector3(0, 0, -0.065)),
      1,
      easeInOutSine
    ),
    camera.moveTo(new Vector3(-1, 0.4, 1), 1, easeInOutSine)
  );

  // execution

  const program_counter = createRef<Label3D>();
  const instruction_register = createRef<Label3D>();
  const accumulator = createRef<Label3D>();
  const ACC = createSignal(0);
  const PC = createSignal(12); // 12 is the start
  const IR = createSignal(0);
  const PANELS_Y = 450;

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
    };
  };

  const updatePC = createLabel(
    cpu.pc,
    program_counter,
    PC,
    "alu",
    "Program Counter (PC)"
  );
  const updateIR = createLabel(
    cpu.ir,
    instruction_register,
    IR,
    "bus",
    "Instruction Register (IR)"
  );
  const updateACC = createLabel(
    cpu.gpr,
    accumulator,
    ACC,
    "control",
    "Accumulator (ACC)"
  );

  function* loadRegisters(index: number) {
    yield code_sample().selection(lines(index + 1), 1);
    yield* sequence(
      0.7,
      all(
        cpu.wire_mc_ram_data.reverseFlow(1, easeInOutSine, 60),
        cpu.wire_mc_ram_address.reverseFlow(1, easeInOutSine, 60)
      ),
      all(
        cpu.wire_mc_ir_margin.currentFlow(1, easeInOutSine, 60),
        cpu.wire_pc_mc.reverseFlow(1, easeInOutSine, 60),
        run(function* () {
          yield* waitFor(0.5);
          updatePC(index + 12);
          updateIR(INSTRUCTIONS[index]);
        })
      ),
      all(
        cpu.wire_ir_cu.currentFlow(1, easeInOutSine, 60),
        cpu.wire_cu_pc.reverseFlow(1, easeInOutSine, 60)
      )
    );
  }

  yield* waitUntil("PC");
  yield* all(
    program_counter().offset2D([630, -450], 1),
    program_counter().popIn(1)
  );

  yield* waitUntil("IR");
  yield code_sample().selection(lines(1), 4);
  yield* all(
    instruction_register().offset2D([-600, -500], 1),
    instruction_register().popIn(1),
    sequence(
      0.6,
      cpu.wire_mc_ram_data.reverseFlow(1),
      cpu.wire_mc_ir_margin.currentFlow(1, easeInOutSine, 100),
      run(function* () {
        updateIR(convertInstruction("LOAD", 1));
      })
    )
  );
  yield* cpu.wire_ir_cu.currentFlow(1);

  yield* waitUntil("load memory");
  yield all(accumulator().offset2D([0, -700], 1), accumulator().popIn(1));
  yield* sequence(
    0.7,
    cpu.wire_mc_ram_data.reverseFlow(1, easeInOutSine, 60),
    cpu.wire_gpr_mc.reverseFlow(1, easeInOutSine, 60),
    run(function* () {
      updateACC(3);
    })
  );

  yield* waitUntil("step 2");
  yield* loadRegisters(1);

  yield* waitUntil("shift");
  yield* sequence(
    0.7,
    cpu.wire_cu_iu.currentFlow(1, easeInOutSine, 60),
    cpu.wire_gpr_iu.reverseFlow(1, easeInOutSine, 60),
    run(function* () {
      updateACC(1);
    })
  );

  yield* waitUntil("reupdate");
  yield* loadRegisters(2);

  yield* waitUntil("increment");
  yield* sequence(
    0.7,
    cpu.wire_cu_iu.currentFlow(1, easeInOutSine, 60),
    cpu.wire_gpr_iu.reverseFlow(1, easeInOutSine, 60),
    run(function* () {
      updateACC(ACC() + 1);
    })
  );

  yield* waitUntil("enter l");
  yield loop(() =>
    chain(
      loadRegisters(3),
      loadRegisters(2),
      sequence(
        0.7,
        cpu.wire_cu_iu.currentFlow(1, easeInOutSine, 60),
        cpu.wire_gpr_iu.reverseFlow(1, easeInOutSine, 60),
        run(function* () {
          updateACC(ACC() + 1);
        })
      )
    )
  );
  yield* waitUntil("pan out");

  yield camera.moveForward(4,80);
  yield camera.moveRight(4,80);

  yield* waitUntil("exit the loop");
  yield* all(
    code_frame().position(0,1),
    code_frame().scale(2,1),
  );

  yield* waitUntil("add two number");
  yield code_sample().selection(DEFAULT, 1);
  yield* code_sample().code(`
    LOAD [0x01]           
    LOAD [0x02]
    ADD ?
    
    `, 1);

  yield* waitUntil("next episode");
  yield* all(
    code_frame().popOut(),
    accumulator().popOut(),
    instruction_register().popOut(),
    program_counter().popOut()
  )

  const context_title = createInfoCard("LEVEL 1 CPU", {
    width: 1600,
    props: { top: [0, -view.size().y / 2 - 250] },
  });
  view.add(context_title.node);
  yield context_title.node.position(context_title.node.position().add([0, 500]), 1)

  yield* waitUntil("next");
});
