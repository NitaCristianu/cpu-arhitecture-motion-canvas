import {
  Gradient,
  Grid,
  Layout,
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
  createRef,
  createRefArray,
  createSignal,
  DEFAULT,
  delay,
  easeInCubic,
  easeInElastic,
  easeInOutCubic,
  easeOutBounce,
  easeOutCubic,
  fadeTransition,
  linear,
  loop,
  range,
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

export default makeScene2D(function* (view) {
  const wrapper = <Node />;
  view.add(wrapper);

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

  const context_title = createInfoCard("DRAM DIE", {
    props: { top: [0, -view.size().y / 2 + 150] },
  });
  view.add(context_title.node);

  const generator = useRandom(1);

  const bytes = createRefArray<Rect>();
  const bitsContainer = (
    <Rect
      position={view
        .size()
        .div(-2)
        .add([-60 - 474 + 25, 250 - 534 + 14])}
      opacity={0}
    >
      {...range(6).flatMap((i) =>
        range(10).map((j) => (
          <Rect
            layout
            direction="row"
            x={j * 486}
            y={i * 485}
            justifyContent={"center"}
            size={485}
            alignItems={"center"}
            stroke={"f5c38b"}
            lineWidth={0}
            ref={bytes}
          >
            {...range(8).map((k) => {
              const value = `${generator.nextInt(0, 2)}`;
              return (
                <Txt
                  fontWeight={200}
                  fontFamily={"Poppins"}
                  fill={"#fffa"}
                  fontSize={80}
                  shadowColor={"#f5c38b"}
                  width={value == "0" ? 50 : 30}
                  textAlign={"center"}
                >
                  {value}
                </Txt>
              );
            })}
          </Rect>
        ))
      )}
    </Rect>
  );
  view.add(bitsContainer);

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
  yield* sequence(0.2, grid.end(1, 0.5));

  yield* waitUntil("zoom in");
  yield* any(
    wrapper.scale(3, 1),
    grid.scale(2, 0.7),
    wrapper.position([1530, 1350], 1)
  );
  yield bitsContainer.opacity(1, 0.5, easeOutCubic);

  yield* waitUntil("select bit");

  const value0 = createSignal("3456.00");
  const value1 = createSignal("Goodbye world!");

  const startbyte = createSignal(23);
  const length = createSignal(3);

  const getwrapper = () => {
    const boxes = range(length()).map((i) => {
      const position = i + startbyte();
      return bytes[position];
    });
    const bboxes = boxes.map((box) => {
      const pos = box.position();
      const size = box.size();
      const parentPos = box.parent()?.position?.() ?? new Vector2();

      const x = pos.x + parentPos.x + (length() * 486) / 2 - 486 / 2;
      const y = pos.y + parentPos.y;

      return new BBox(x, y, size.x - 30, size.y);
    });

    const container = BBox.fromBBoxes(...bboxes);

    return container;
  };

  const wrapper0 = getwrapper();
  const rect0 = (
    <Glass
      size={wrapper0.size}
      position={wrapper0.position.addY(50)}
      scale={0}
      translucency={0.1}
      lightness={-5}
    >
      <Txt
        fill={"#ccc"}
        shadowBlur={20}
        shadowColor={"#000"}
        fontFamily={"Poppins"}
        fontSize={120}
        zIndex={2}
        text={value0}
      ></Txt>
    </Glass>
  ) as Glass;
  view.add(rect0);
  yield* chain(
    all(
      ...range(length()).map((i) =>
        chain(
          all(
            (bytes[i + startbyte()] as Rect).fill("#f5c38b44", 1),
            (bytes[i + startbyte()] as Rect).lineWidth(10, 1),
            (bytes[i + startbyte()] as Rect).shadowBlur(45, 0.5),
            (bytes[i + startbyte()] as Rect).scale(1.05, 0.2).back(0.2)
          ),
          all(
            (bytes[i + startbyte()] as Rect).radius(32, 1),
            (bytes[i + startbyte()] as Rect).scale(0.8, 0.6)
          )
        )
      )
    ),
    waitFor(0.5),
    all(
      rect0.size(rect0.size().sub(120), 0.33, easeOutCubic),
      rect0.scale(1, 0.5, easeOutCubic),
      rect0.radius(32, 0.33, easeOutCubic),
      rect0.y(rect0.y() - 50, 0.33, easeOutCubic),
      all(
        ...range(length()).map((i) =>
          all(
            (bytes[i + startbyte()] as Rect).radius(0, 1),
            (bytes[i + startbyte()] as Rect).scale(0, 0.6)
          )
        )
      )
    )
  );

  startbyte(42);
  length(7);
  const wrapper1 = getwrapper();
  const rect1 = (
    <Glass
      size={wrapper1.size}
      position={wrapper1.position.addY(50)}
      scale={0}
      translucency={0.1}
      lightness={-5}
    >
      <Txt
        fill={"#ccc"}
        fontFamily={"Poppins"}
        fontSize={120}
        shadowBlur={20}
        shadowColor={"#000"}
        zIndex={2}
        text={value1}
      ></Txt>
    </Glass>
  ) as Glass;
  view.add(rect1);

  yield* chain(
    all(
      ...range(length()).map((i) =>
        chain(
          all(
            (bytes[i + startbyte()] as Rect).fill("#f5c38b44", 1),
            (bytes[i + startbyte()] as Rect).lineWidth(10, 1),
            (bytes[i + startbyte()] as Rect).shadowBlur(45, 0.5),
            (bytes[i + startbyte()] as Rect).scale(1.05, 0.2).back(0.2)
          ),
          all(
            (bytes[i + startbyte()] as Rect).radius(32, 1),
            (bytes[i + startbyte()] as Rect).scale(0.8, 0.6)
          )
        )
      )
    ),
    waitFor(0.5),
    all(
      rect1.size(rect1.size().sub(120), 0.33, easeOutCubic),
      rect1.scale(1, 0.5, easeOutCubic),
      rect1.radius(32, 0.33, easeOutCubic),
      rect1.y(rect1.y() - 50, 0.33, easeOutCubic),
      all(
        ...range(length()).map((i) =>
          all(
            (bytes[i + startbyte()] as Rect).radius(0, 1),
            (bytes[i + startbyte()] as Rect).scale(0, 0.6)
          )
        )
      )
    )
  );

  yield* waitUntil("modify");
  const messages = [
    "Loading Memory...",
    "DRAM Access OK",
    "Cache Miss",
    "Fetching 0x7A2C",
    "Write Complete",
    "Refresh Cycle",
    "Address: 0xFFEE",
    "Syncing Blocks...",
    "Latency 13.5ns",
    "Overflow Averted",
  ];
  yield context_title.glass().y(-1200, 1);
  yield loop((i) =>
    chain(
      sequence(
        // initial small pause before each batch
        0.5,
        // update the numeric value
        all(
          value0(generator.nextFloat(-4560, 3450).toFixed(2), 0.5),
          rect0.scale(1.2, 0.3).back(0.3),
          rect0.translucency(0.6, 0.5),
          rect0.lightness(2.6, 0.5),
          rect1.lightness(0, 0.5),
          rect1.scale(1, 0.5)
        ),
        // alternate between your two strings
        all(
          value1(messages[i % messages.length], 0.5),
          rect1.scale(1.03, 0.3).back(0.3),
          rect0.scale(1, 0.5),
          rect0.lightness(0, 0.5),
          rect1.lightness(2.6, 0.5),
          rect1.translucency(0.6, 0.5)
        )
      ),

      // wait 0.7s before the next sequence
      waitFor(0.3)
    )
  );
  yield* waitUntil("address");
  wrapper.remove();
  rect0.remove();
  rect1.remove();
  yield view.skew([0, 0], 1);
  bytes.forEach((byte) => byte.remove());
  const containerMemoryAddresses = createRef<Rect>();
  const holderMemoryAddresses = createRef<Rect>();
  const memoryarray = createRefArray<Txt>();
  const memorygrid = createRef<Grid>();
  view.add(
    <Glass
      ref={containerMemoryAddresses}
      scale={0}
      size={[2400, 1400]}
      stroke={"#fff4"}
      lineWidth={5}
      radius={64}
      lightness={-1}
      translucency={0.15}
      clip
    >
      <Rect ref={holderMemoryAddresses}>
        {...range(10).flatMap((i) =>
          range(6).map((j) => (
            <Txt
              zIndex={1}
              fill={"#fff"}
              x={(i - 4) * 250 - 125}
              y={(j - 2) * 250 - 125}
              opacity={0}
              ref={memoryarray}
            >
              {(j * 10 + i).toString(16) + "000"}
            </Txt>
          ))
        )}
      </Rect>
      <Grid
        ref={memorygrid}
        spacing={250}
        size={"100%"}
        stroke={"#fff4"}
        zIndex={2}
      />
    </Glass>
  );
  const cursorref = createRef<Cursor>();
  view.add(<Cursor ref={cursorref} position={[1000, 800]}></Cursor>);
  yield* all(containerMemoryAddresses().scale(1, 1));
  yield delay(1, cursorref().pop());
  yield* sequence(
    0.02,
    ...memoryarray.map((memory) => memory.opacity(1, 0.3, easeOutCubic))
  );
  yield* loop(7, function* () {
    const pos =
      memoryarray[generator.nextInt(0, memoryarray.length)].position();
    yield* cursorref().to(pos, 0.4);
  });
  const overlay = createRef<Rect>();
  view.add(<Rect fill={"#ccc"} opacity={0} ref={overlay} size={"100%"}></Rect>);
  yield* all(
    cursorref().pop(),
    ...memoryarray.map((memory) => memory.opacity(0, .5, easeInCubic)),
    delay(3, overlay().opacity(0.5, 1, easeOutCubic)),
    holderMemoryAddresses().scale(0, 2, easeOutCubic),
    memorygrid().spacing(0.1, 3, easeOutCubic),
    containerMemoryAddresses().scale(2, 3, easeInCubic)
  );
  containerMemoryAddresses().remove();

  yield* waitUntil("end");
});
