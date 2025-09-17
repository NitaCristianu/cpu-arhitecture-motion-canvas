import {
  Gradient,
  Grid,
  Layout,
  Line,
  makeScene2D,
  Node,
  Ray,
  Rect,
  Txt,
} from "@motion-canvas/2d";
import {
  all,
  any,
  BBox,
  chain,
  createEffect,
  createRef,
  createRefArray,
  createSignal,
  DEFAULT,
  delay,
  easeInBack,
  easeInCubic,
  easeInElastic,
  easeInOutCubic,
  easeOutBack,
  easeOutBounce,
  easeOutCubic,
  fadeTransition,
  linear,
  loop,
  range,
  run,
  sequence,
  useLogger,
  useRandom,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { Vector2 } from "three";
import { ShaderBackground } from "../components/background";
import { Glass } from "../components/GlassRect";
import { Cursor } from "../components/cursor";
import { createInfoCard } from "../utils/infocard";
import { Bitnumber } from "../utils/bitnumber";

type CellType = " " | "SA" | "DEC" | "MUX" | "CTRL";

const peripheryLayout: CellType[][] = [
  [
    " ",
    " ",
    "SA",
    "SA",
    " ",
    " ",
    "SA",
    "SA",
    " ",
    " ",
    "SA",
    "SA",
    " ",
    " ",
    " ",
    " ",
    "CTRL",
    "CTRL",
    " ",
    " ",
    "SA",
    "SA",
    " ",
    " ",
    "SA",
    "SA",
    " ",
    " ",
    " ",
    " ",
  ],
  [
    "DEC",
    "DEC",
    " ",
    " ",
    "DEC",
    "DEC",
    " ",
    " ",
    "MUX",
    "MUX",
    " ",
    " ",
    "DEC",
    "DEC",
    "CTRL",
    "CTRL",
    " ",
    " ",
    "DEC",
    "DEC",
    " ",
    " ",
    "MUX",
    "MUX",
    " ",
    " ",
    "DEC",
    "DEC",
    "DEC",
    "DEC",
  ],
  [
    " ",
    " ",
    "SA",
    "SA",
    " ",
    " ",
    " ",
    " ",
    "SA",
    "SA",
    " ",
    " ",
    "SA",
    "SA",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    " ",
    "SA",
    "SA",
    " ",
    " ",
    "SA",
    "SA",
    "SA",
    "SA",
  ],
];

const COLOR_MAP: Record<CellType, string> = {
  " ": "#0000",
  SA: "#4da4e7",
  DEC: "#1f6db2",
  MUX: "#3d85c6",
  CTRL: "#93c9f7",
};

const LEVEL1_INSTRUCTIONS: [string, string][] = [
  ["NOP", "No operation"],
  ["HLT", "Halt execution"],
  ["LOAD", "Load value from memory into ACC"],
  ["STORE", "Store ACC into memory"],
  ["ADD", "ACC = ACC + operand"],
  ["SUB", "ACC = ACC - operand"],
  ["MUL", "ACC = ACC * operand"],
  ["INC", "Increment ACC"],
  ["DEC", "Decrement ACC"],
  ["AND", "Bitwise AND with ACC"],
  ["OR", "Bitwise OR with ACC"],
  ["XOR", "Bitwise XOR with ACC"],
  ["NOT", "Bitwise NOT (invert ACC)"],
  ["SHL", "Shift ACC left (ACC << 1)"],
  ["SHR", "Shift ACC right (ACC >> 1)"],
  ["JMP", "Jump to memory address (unconditional)"],
];

const PROGRAM_BYTES: number[] = [
  0x22, // LOAD 0x2
  0x47, // ADD #7
  0x33, // STORE 0x3
  0xf8, // JMP 0x0 (loop back)
];

export default makeScene2D(function* (view) {
  const wrapper = <Node />;
  view.add(wrapper);

  const startbyte = createSignal(7);
  const length = createSignal(4);

  const backgroundGradient = new Gradient({
    type: "linear",
    from: () => new Vector2(0, -540),
    to: () => new Vector2(0, 540),
    stops: [
      { offset: 0, color: "rgb(0, 3, 12)" },
      { offset: 1, color: "rgb(0, 0, 19)" },
    ],
  });
  view.fill(backgroundGradient);

  const bgr = (
    <ShaderBackground
      size={"100%"}
      preset="ramDark"
      opacity={0.5}
      zIndex={-10}
    />
  );
  view.add(bgr);

  const grid = (
    <Grid end={0} size={"100%"} scale={1} stroke={"#fff4"} />
  ) as Grid;
  wrapper.add(grid);

  const context_title = createInfoCard("Inside the RAM", {
    props: { top: [0, -view.size().y / 2 + 150] },
  });
  view.add(context_title.node);

  const generator = useRandom(1);

  const bytes = createRefArray<Txt>();

  // your grid (only change: ref on Txt + a visible stroke color)
  const bitsContainer = (
    <Rect size={"100%"} offset={1} opacity={0} x={200} y={680}>
      {...range(2).flatMap((i) =>
        range(6).map((j) => (
          <Txt
            ref={bytes}
            fontFamily="Fira Code"
            fontSize={() => 0.14 * grid.spacing().x * wrapper.scale().x}
            y={() => i * grid.spacing().x * wrapper.scale().x}
            x={() => j * grid.spacing().y * wrapper.scale().y}
            fill={"#e0e0e0d4"}
            textAlign={"center"}
          >
            <Txt
              text={generator.nextInt(0, 256).toString(2).padStart(8, "0")}
            ></Txt>
            <Txt
              fontSize={50}
              text={"\n location 0x" + (j + i * 6).toString(16)}
            ></Txt>
          </Txt>
        ))
      )}
    </Rect>
  );
  view.add(bitsContainer);
  bytes[2].childAs<Txt>(0).text("00001001");
  range(length()).map((i) =>
    (bytes[i + startbyte()] as Txt)
      .childAs<Txt>(0)
      .text(
        PROGRAM_BYTES[i % PROGRAM_BYTES.length].toString(2).padStart(8, "0")
      )
  );

  const periphery_cells = createRefArray<Rect>();
  const periphery = (
    <Rect
      fill={"rgb(2, 1, 17)"}
      shadowColor={"rgb(2, 1, 17)"}
      shadowBlur={50}
      width={"101%"}
      height={150}
      stroke={"#aaf4"}
      lineWidth={2}
    >
      <Node x={-view.size().x / 2 + 50} y={-30}>
        {...peripheryLayout.flatMap((rowData, row) =>
          rowData.map((el, col) => (
            <Rect
              position={[col * 50, row * 30]}
              size={[10, 10]}
              shadowBlur={40}
              shadowColor={COLOR_MAP[el]}
              fill={COLOR_MAP[el]}
              ref={periphery_cells}
            />
          ))
        )}
      </Node>
      <Node scaleX={-1} x={view.size().x / 2 - 70} y={-30}>
        {...peripheryLayout.flatMap((rowData, row) =>
          rowData.map((el, col) => (
            <Rect
              position={[col * 50, row * 30]}
              size={[10, 10]}
              shadowBlur={40}
              shadowColor={COLOR_MAP[el]}
              fill={COLOR_MAP[el]}
              ref={periphery_cells}
            />
          ))
        )}
      </Node>
      <Txt
        fill={"rgb(0, 174, 255)"}
        opacity={0.5}
        shadowBlur={10}
        shadowColor={"rgb(196, 207, 231)"}
        fontSize={70}
        letterSpacing={50}
      >
        PERIPHERY
      </Txt>
    </Rect>
  );

  wrapper.add(periphery);

  // cell pulse
  yield loop(() =>
    sequence(
      0.012,
      ...periphery_cells.map((cell) =>
        cell.opacity(0.1, 0.2, easeInElastic).back(0.2, easeOutBounce)
      )
    )
  );
  yield* waitFor(0.3);
  yield sequence(0.2, grid.end(1, 0.5));

  yield* waitUntil("zoom in");
  yield delay(1, bitsContainer.opacity(1, 1));
  yield* any(
    wrapper.scale(3, 1.5),
    grid.spacing(250, 2),
    wrapper.position([1530, 1500], 1.5)
  );

  yield context_title.node.y(-2000, 1);
  yield* chain(
    sequence(
      0.01,
      ...range(length()).map((i) =>
        all(
          (bytes[i + startbyte()] as Txt).shadowBlur(140, 1.5),
          (bytes[i + startbyte()] as Txt).shadowColor("#fff", 1)
        )
      )
    ),
    sequence(
      0.01,
      ...range(length()).map((i) =>
        all(
          (bytes[i + startbyte()] as Txt).childAs<Txt>(0).text(() => {
            const bt = PROGRAM_BYTES[i % PROGRAM_BYTES.length];
            const a = LEVEL1_INSTRUCTIONS[bt >> 4][0];
            const b = bt & 0xf;
            return a + " " + b;
          }, 0.6)
        )
      )
    )
  );

  const program_counter = (
    <Txt
      fontFamily={"Poppins"}
      fontWeight={700}
      fontSize={100}
      fill={"#ff0d"}
      scale={0}
      opacity={0.5}
    >
      PC
    </Txt>
  ) as Txt;
  program_counter.absolutePosition(bytes[7].absolutePosition().addY(-700).addX(-1550));
  view.add(program_counter);
  const acc_value = createSignal(0);
  const pc_value = createSignal(7);
  const ACClabel = (
    <Glass lightness={0.5} size={[1700, 300]} y={800} x={-1080}>
      <Txt
        zIndex={1}
        fill={"white"}
        fontFamily={"Poppins"}
        fontSize={80}
        x={-700}
      >
        ACC
      </Txt>
      <Bitnumber initialVisibility zIndex={1} bitgroups={2} x={50} />
    </Glass>
  ) as Glass;
  ACClabel.save();
  ACClabel.scale(0);
  ACClabel.x(-2000);
  const PClabel = (
    <Glass lightness={0.5} size={[1700, 300]} y={800} x={1080}>
      <Txt
        zIndex={1}
        fill={"white"}
        fontFamily={"Poppins"}
        fontSize={80}
        x={700}
      >
        PC
      </Txt>
      <Bitnumber
        initialVisibility
        zIndex={1}
        number={pc_value()}
        bitgroups={2}
        x={-150}
      />
    </Glass>
  ) as Glass;
  PClabel.save();
  PClabel.scale(0);
  PClabel.x(2000);

  view.add(PClabel);
  view.add(ACClabel);
  function* pc_goto(i: number, wait = true, offset = 0) {
    const address = startbyte() + i + offset;


    pc_value(address);
    const pc = PClabel.childAs<Bitnumber>(1);
    yield delay(
      0.2,
      run(function* () {
        pc.load(pc_value());
      })
    );

    const b = address;
    const t = bytes[b];
    const pos = t.absolutePosition();
    const op = bytes[b].childAs<Txt>(0).text();
    const original_fill = t.fill();
    const original_sc = t.shadowColor();
    yield t.fill("#ff0", .7);
    yield t.shadowColor("#ff0", .7);
    yield* chain(
      waitFor(0.2),
      program_counter.absolutePosition(pos.addY(-130), 0.5),
      waitFor(0.2)
    );
    const acc = ACClabel.childAs<Bitnumber>(1);
    if (op.startsWith("LOAD") && wait) {
      acc.load(9);
      acc_value(9);
      const line = (
        <Ray
          from={bytes[2].position().add([-1800, -100])}
          to={ACClabel.top()}
          shadowColor={"#849de9"}
          stroke={"#3b78f0"}
          lineWidth={4}
          endOffset={30}
          startOffset={30}
          lineDash={[50, 20]}
          endArrow
          end={0}
        />
      ) as Line;
      view.add(line);
      yield chain(line.end(1, 0.5), waitFor(0.2), line.start(1, 0.5));
    }

    if (op.startsWith("ADD")) {
      const line = (
        <Ray
          from={bytes[8].position().add([-1800, -200])}
          to={ACClabel.top()}
          shadowColor={"#849de9"}
          stroke={"#3b78f0"}
          lineDash={[50, 20]}
          lineWidth={4}
          endOffset={30}
          startOffset={30}
          endArrow
          end={0}
        />
      ) as Line;
      view.add(line);
      yield chain(line.end(1, 0.5), waitFor(0.2), line.start(1, 0.5));
      yield* waitFor(0.2);
      acc.load(acc_value() + 7);
      acc_value(acc_value() + 7);
      yield* waitFor(0.4);
    }
    if (op.startsWith("STORE")) {
      const b3 = bytes[3];
      b3.childAs<Txt>(0).shadowColor("#849de9");
      const col = b3.fill();
      const line = (
        <Ray
          // from={bytes[9].position().add([-1800, -600])}
          from={ACClabel.top()}
          to={bytes[3].position().add([-1800, -100])}
          shadowColor={"#849de9"}
          stroke={"#3b78f0"}
          lineDash={[50, 20]}
          lineWidth={4}
          endOffset={30}
          startOffset={30}
          endArrow
          end={0}
        />
      ) as Line;
      view.add(line);
      yield chain(line.end(1, 0.5), waitFor(0.2), line.start(1, 0.5));
      yield chain(
        all(
          b3
            .childAs<Txt>(0)
            .text(acc_value().toString(2).padStart(8, "0"), 0.5),
          b3.childAs<Txt>(0).shadowBlur(140, 0.4),
          b3.childAs<Txt>(0).fill("#3b68f0", 0.4)
        ),
        b3.childAs<Txt>(0).shadowBlur(0, 0.4),
        b3.childAs<Txt>(0).fill(col, 0.4)
      );
    }
    yield* waitFor(0.3);
    if (op.startsWith("JMP")) {
      const line = (
        <Ray
          from={bytes[10].position().add([-1800, -100])}
          to={bytes[8].position().add([-1900, -100])}
          lineDash={[50, 20]}
          shadowBlur={30}
          shadowColor={"#849de9"}
          stroke={"#3b78f0"}
          lineWidth={4}
          endOffset={30}
          startOffset={30}
          endArrow
          end={0}
        />
      ) as Line;
      view.add(line);
      yield chain(line.end(1, 0.5), waitFor(0.2), line.start(1, 0.5));
    }
    if (wait) yield* waitFor(0.5);
    yield all(
      t.shadowColor(original_sc, 1),
      t.fill(original_fill, 1),
    );
  }

  yield* waitUntil("go");

  yield all(
    ACClabel.restore(1, easeOutCubic),
    PClabel.restore(1, easeOutCubic),
    wrapper.y(wrapper.y() - 200, 1),
    all(...bytes.map((b) => b.y(b.y() - 200, 1)))
  );
  yield* all(
    program_counter.scale(1, 0.5, easeOutBack),
    program_counter.opacity(1, 0.5, easeOutCubic)
  );
  yield* loop(4, (i) => pc_goto(i));
  yield* loop(2, () => loop(3, (i) => pc_goto(i, false, 1)));
  yield* loop(2, (i) => pc_goto(i, false, 1));
  yield program_counter.scale(0,.5,easeInBack);

  yield* waitUntil("end");
});
