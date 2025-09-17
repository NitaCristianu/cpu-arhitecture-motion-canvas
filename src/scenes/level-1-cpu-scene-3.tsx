import {
  Grid,
  Img,
  makeScene2D,
  Txt,
  Ray,
  Line,
  Rect,
  Icon,
  Layout,
} from "@motion-canvas/2d";
import {
  all,
  chain,
  Color,
  createRef,
  createRefArray,
  delay,
  easeInCirc,
  easeInCubic,
  easeInOutExpo,
  easeInOutSine,
  easeOutBack,
  easeOutCirc,
  easeOutCubic,
  range,
  sequence,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";

import SN74181 from "../assets/74181.jpg";
import SN74181Circuit from "../assets/SN74181-Circuit.png";
import SN74181Table from "../assets/SN74181-Table.jpg";
import { ShaderBackground } from "../components/background";
import { Bitnumber } from "../utils/bitnumber";

export default makeScene2D(function* (view) {
  view.fill("rgba(11, 33, 51, 1)");

  const bgr = <ShaderBackground opacity={0.3} />;
  view.add(bgr);
  const container = (
    <Grid stroke={"#fff3"} lineWidth={3} spacing={300} size={"1000%"} />
  ) as Grid;
  yield container.spacing(300 + 60, 20);

  view.add(container);

  const SN74181Image = createRef<Img>();
  const SN74181Context = createRef<Txt>();
  const SN74181Title = createRef<Txt>();

  container.add(
    <Img
      src={SN74181}
      width={1600}
      radius={64}
      scale={0.3}
      opacity={0}
      ref={SN74181Image}
    >
      <Txt
        text={
          "The first ALU chip, built by Texas Instruments in 1970. Photo courtesy of logicroom.jp."
        }
        fill={"d0d0d0"}
        fontFamily={"Poppins"}
        y={530}
        width={1600}
        textWrap
        ref={SN74181Context}
      />
      <Txt
        text={"SN74181"}
        fill={"d0d0d0"}
        fontFamily={"Poppins"}
        y={-600}
        width={400}
        fontSize={120}
        ref={SN74181Title}
      />
    </Img>
  );
  SN74181Context().save();
  SN74181Context().text("");

  SN74181Title().save();
  SN74181Title().scale(0);

  yield* waitUntil("begin");
  yield* sequence(
    0.6,
    all(SN74181Image().scale(1, 1), SN74181Image().opacity(1, 1)),
    SN74181Title().restore(1, easeOutCirc),
    SN74181Context().restore(1, easeOutCirc)
  );

  const SN74181_CircuitImage = createRef<Img>();
  {
    yield* waitUntil("gAtes");
    const left = SN74181Image().right();
    const right = left.addX(2000);

    const ray = createRef<Ray>();
    container.add(
      <Line
        points={[left, right.lerp(left, 0.5).addY(-300), right]}
        stroke={"#ff0"}
        shadowBlur={50}
        shadowColor={"#ff0a"}
        lineWidth={15}
        endOffset={30}
        startOffset={30}
        radius={1000}
        end={0}
        ref={ray}
        endArrow
        arrowSize={50}
        lineDash={[150, 10]}
      />
    );
    container.add(
      <Img
        ref={SN74181_CircuitImage}
        src={SN74181Circuit}
        left={right.addX(860)}
        width={1600}
        scale={0}
        opacity={0.5}
        radius={64}
        shadowColor={"#fff5"}
      >
        <Txt
          fontFamily={"Poppins"}
          fill={"#fff"}
          shadowBlur={30}
          shadowColor={"#fff5"}
          y={-730}
          fontSize={100}
        >
          <Txt>Gate-level design</Txt>
        </Txt>
        <Txt
          fontFamily={"Poppins"}
          fill={"#fffd"}
          shadowBlur={10}
          shadowColor={"#fff3"}
          y={-640}
          fontSize={30}
        >
          mydiagram.online/block-diagram-of-74181/
        </Txt>
      </Img>
    );
    yield all(
      ray().start(1, 1, easeInOutSine),
      container.x(-4700, 2.5),
      container.y(150, 2.5),
      container.scale(1.3, 2.5)
    );
    yield* delay(
      1,
      chain(
        all(
          SN74181_CircuitImage().scale(1, 1, easeOutCubic),
          SN74181_CircuitImage().opacity(1, 1, easeOutCubic)
        ),
        all(
          SN74181_CircuitImage().shadowBlur(400, 1).to(140, 1),
          SN74181_CircuitImage().scale(1.1, 1).to(1, 1)
        )
      )
    );
  }

  {
    yield* waitUntil("table");
    const top = SN74181_CircuitImage().bottom();
    const bottom = top.add([-1500, 1500]);

    const ray = createRef<Ray>();
    container.add(
      <Line
        points={[top, bottom.lerp(top, 0.5).addX(-300), bottom]}
        stroke={"yellow"}
        shadowBlur={50}
        shadowColor={"#ff0a"}
        lineWidth={15}
        endOffset={50}
        startOffset={50}
        radius={1000}
        end={0}
        ref={ray}
        endArrow
        arrowSize={50}
        lineDash={[150, 10]}
      />
    );

    const img_table = createRef<Img>();

    const traits_table = createRef<Rect>();

    const func_column_rect = createRef<Rect>();
    const functionality_rect = createRef<Rect>();
    const func_column_rect2 = createRef<Rect>();
    const functionality_rect2 = createRef<Rect>();
    container.add(
      <Rect>
        <Img
          ref={img_table}
          layout={false}
          src={SN74181Table}
          top={bottom.addY(860)}
          width={1600}
          scale={0}
          opacity={0.5}
          radius={64}
          shadowColor={"#fff5"}
        >
          <Rect
            fill={"yellow"}
            size={[530, 950]}
            x={-5}
            y={5}
            opacity={0}
            scaleX={0.7}
            ref={func_column_rect}
          />
          <Rect
            size={[180, 720]}
            x={-185}
            y={118}
            opacity={0.5}
            ref={functionality_rect}
          />
          <Rect
            fill={"yellow"}
            size={[530, 950]}
            x={530}
            y={5}
            opacity={0}
            scaleX={0.7}
            ref={func_column_rect2}
          />
          <Rect
            size={[180, 720]}
            x={-185 + 535}
            y={118}
            opacity={0.5}
            ref={functionality_rect2}
          />
          <Txt
            fontFamily={"Poppins"}
            fill={"#fff"}
            shadowBlur={30}
            shadowColor={"#fff5"}
            y={-730}
            fontSize={100}
          >
            <Txt>Functionality</Txt>
          </Txt>
          <Txt
            fontFamily={"Poppins"}
            fill={"#fffd"}
            shadowBlur={10}
            shadowColor={"#fff3"}
            y={-640}
            fontSize={30}
          >
            simplecpudesign.com
          </Txt>
        </Img>
      </Rect>
    );

    container.add(
      <Rect
        gap={50}
        direction={"column"}
        layout
        left={() => img_table().right().addX(100)}
        ref={traits_table}
      >
        <Txt
          fontFamily={"Poppins"}
          fill={"#fff"}
          shadowBlur={30}
          shadowColor={"#fff5"}
          fontSize={100}
          scale={0}
        >
          SN74181 Features
        </Txt>

        {/* Trait 1 */}
        <Rect
          scaleY={0}
          alignItems={"center"}
          layout
          direction={"row"}
          gap={25}
        >
          <Icon icon={"mdi:numeric-4-box"} color={"#fffd"} width={70} />
          <Txt
            fontFamily={"Poppins"}
            fill={"#fffd"}
            shadowBlur={12}
            shadowColor={"#fff3"}
            fontSize={36}
          >
            Works on 4-bit numbers
          </Txt>
        </Rect>

        {/* Trait 2 */}
        <Rect
          scaleY={0}
          alignItems={"center"}
          layout
          direction={"row"}
          gap={25}
        >
          <Icon icon={"mdi:plus"} color={"#fffd"} width={70} />
          <Txt
            fontFamily={"Poppins"}
            fill={"#fffd"}
            shadowBlur={12}
            shadowColor={"#fff3"}
            fontSize={36}
          >
            Supports addition
          </Txt>
        </Rect>

        {/* Trait 3 */}
        <Rect
          scaleY={0}
          alignItems={"center"}
          layout
          direction={"row"}
          gap={25}
        >
          <Icon icon={"mdi:minus"} color={"#fffd"} width={70} />
          <Txt
            fontFamily={"Poppins"}
            fill={"#fffd"}
            shadowBlur={12}
            shadowColor={"#fff3"}
            fontSize={36}
          >
            Subtraction via inverted add
          </Txt>
        </Rect>

        {/* Trait 5 */}
        <Rect
          scaleY={0}
          alignItems={"center"}
          layout
          direction={"row"}
          gap={25}
        >
          <Icon icon={"mdi:alpha-o-box"} color={"#fffd"} width={70} />
          <Txt
            fontFamily={"Poppins"}
            fill={"#fffd"}
            shadowBlur={12}
            shadowColor={"#fff3"}
            fontSize={36}
          >
            Can set or clear outputs
          </Txt>
        </Rect>

        {/* Trait 4 */}
        <Rect
          scaleX={0}
          alignItems={"center"}
          layout
          direction={"row"}
          gap={25}
        >
          <Icon icon={"mdi:alpha-x-box"} color={"#fffd"} width={70} />
          <Txt
            fontFamily={"Poppins"}
            fill={"#fffd"}
            shadowBlur={12}
            shadowColor={"#fff3"}
            fontSize={36}
          >
            Does basic math
          </Txt>
        </Rect>
      </Rect>
    );

    yield all(
      ray().start(1, 2, easeInOutSine),
      container.x(-2700, 2.5),
      container.y(-3700, 2.5),
      container.scale(1.3, 2.5)
    );
    yield* delay(
      1,
      all(
        img_table().scale(1, 1, easeOutCubic),
        img_table().opacity(1, 1, easeOutCubic)
      )
    );

    yield* waitUntil("traits");
    yield* all(
      container.x(container.x() - 500, 1),
      traits_table().childAs<Txt>(0).scale(1, 1, easeOutCubic)
    );

    yield* traits_table().childAs<Txt>(1).scale(1, 1, easeOutCubic);

    yield* waitUntil("logic functions");
    yield* sequence(
      0.3,
      all(
        func_column_rect().opacity(0.3, 0.5, easeOutCubic),
        func_column_rect().scale(1, 0.5, easeOutCubic)
      ),
      all(
        func_column_rect2().opacity(0.3, 0.5, easeOutCubic),
        func_column_rect2().scale(1, 0.5, easeOutCubic)
      )
    );
    yield* sequence(
      0.3,
      all(
        func_column_rect().size(functionality_rect().size, 0.5),
        func_column_rect().position(functionality_rect().position, 0.5)
      ),
      all(
        func_column_rect2().size(functionality_rect2().size, 0.5),
        func_column_rect2().position(functionality_rect2().position, 0.5)
      )
    );
    yield* sequence(
      1.3,
      traits_table().childAs<Txt>(2).scale(1, 1, easeOutCubic),
      traits_table().childAs<Txt>(3).scale(1, 1, easeOutCubic),
      traits_table().childAs<Txt>(4).scale(1, 1, easeOutCubic),
      traits_table().childAs<Txt>(5).scale(1, 1, easeOutCubic)
    );
  }

  const META = [
    { label: "Year: 1970½", icon: "mdi:calendar-clock" }, // absurd on purpose
    { label: "Family: Peel", icon: "mdi:resistor" },
    { label: "Bus: 8-bit", icon: "mdi:numeric-8-box" },
    { label: "Made by BananaLogic", icon: "mdi:arrow-right-bold" },
  ];

  const SPECS = [
    { t: "8-bit data path", icon: "mdi:numeric-8-box" },
    { t: "Multiply", icon: "mdi:multiplication" },
    { t: "Add", icon: "mdi:plus" },
    { t: "Subtract", icon: "mdi:minus" },
    { t: "12 total ops", icon: "mdi:function-variant" },
  ];

  const banalogic = createRef<Rect>();
  const icon = createRef<Icon>();
  const metas = createRefArray<Rect>();
  const rows = createRefArray<Rect>();
  const opsBadge = createRef<Rect>();

  container.add(
    <Rect
      ref={banalogic}
      layout
      direction={"column"}
      gap={40}
      position={[5600, 2900]}
      width={1200}
      padding={48}
      radius={36}
      fill={"#ffffff10"}
      stroke={"#ffffff25"}
      lineWidth={2}
      shadowBlur={60}
      shadowColor={"#000000aa"}
      opacity={0}
      scale={0.9}
    >
      {/* Header */}
      <Rect layout direction={"row"} gap={24} alignItems={"center"}>
        <Icon
          ref={icon}
          icon={"twemoji:banana"}
          width={86}
          color={"#fff"}
          opacity={0}
          scale={0.8}
        />
        <Txt
          fontFamily={"Poppins"}
          fontSize={72}
          fill={"#fff"}
          shadowBlur={30}
          shadowColor={"#fff5"}
        >
          Peel-181
        </Txt>
        <Rect
          ref={opsBadge}
          radius={999}
          padding={[10, 18]}
          fill={"#ffffff1a"}
          opacity={0}
          scale={0.8}
        >
          <Txt fontFamily={"Poppins"} fontSize={36} fill={"#fffd"}>
            12 ops
          </Txt>
        </Rect>
      </Rect>

      {/* Providers */}
      <Rect layout direction={"row"} gap={16}>
        {META.map((p) => (
          <Rect
            key={p.label}
            ref={metas}
            layout
            direction={"row"}
            gap={10}
            padding={[10, 16]}
            radius={999}
            fill={"#ffffff14"}
            stroke={"#ffffff22"}
            lineWidth={1}
            opacity={0}
            scale={0.9}
            alignItems={"center"}
          >
            <Icon icon={p.icon} width={28} color={"#fffd"} />
            <Txt fontFamily={"Poppins"} fontSize={26} fill={"#fffd"}>
              {p.label}
            </Txt>
          </Rect>
        ))}
      </Rect>

      {/* Specs */}
      <Rect layout direction={"column"} gap={18}>
        {SPECS.map((s) => (
          <Rect
            key={s.t}
            ref={rows}
            layout
            direction={"row"}
            gap={16}
            opacity={0}
            y={8}
            alignItems={"center"}
          >
            <Icon icon={s.icon} width={70} color={"#fffd"} />
            <Txt
              fontFamily={"Poppins"}
              fontSize={36}
              fill={"#fffd"}
              shadowBlur={12}
              shadowColor={"#fff3"}
            >
              {s.t}
            </Txt>
          </Rect>
        ))}
      </Rect>
    </Rect>
  );
  yield* waitUntil("bananalogic");
  yield sequence(0.2, container.x(container.x() - 4000 - 50, 2));
  yield* waitFor(1);
  yield* chain(
    all(banalogic().opacity(1, 0.5), banalogic().scale(1.5, 0.6, easeOutBack)),
    all(icon().opacity(1, 0.3), icon().scale(1, 0.3, easeOutBack)),
    all(opsBadge().opacity(1, 0.25), opsBadge().scale(1, 0.25, easeOutBack)),
    sequence(
      0.08,
      ...metas.map((p) =>
        all(p.opacity(1, 0.25), p.scale(1, 0.25, easeOutBack))
      )
    ),
    sequence(
      0.06,
      ...rows.map((r) => all(r.opacity(1, 0.25), r.y(0, 0.25, easeOutBack)))
    ),
    waitFor(0.1)
  );

  yield* waitUntil("8bit");
  yield* all(
    ...metas.map((m, i) => (i != 2 ? m.opacity(0.4, 0.4, easeOutCubic) : null))
  );
  yield* waitUntil("mul");
  yield* all(
    ...rows.map((r, i) => (i != 1 ? r.opacity(0.4, 0.4, easeOutCubic) : null))
  );
  yield* waitUntil("numbers");
  const title = (
    <Txt
      fill={"white"}
      fontFamily={"Poppins"}
      fontWeight={500}
      fontSize={200}
      scale={0}
      shadowBlur={300}
      shadowColor={"#fffa"}
      y={banalogic().y() - 4700}
      x={banalogic().x()}
    >
      Binary interpretation
    </Txt>
  );
  container.add(title);
  yield* sequence(
    0.5,
    container.y(container.y() + 6000, 1),
    title.scale(1, 1, easeOutBack)
  );

  yield* waitUntil("representation");
  const line = createRef<Ray>();
  container
    .children()
    .forEach((child) => (child != title ? child.remove() : null));
  container.add(
    <Ray
      ref={line}
      fromY={-4200}
      toY={4200}
      shadowBlur={60}
      shadowColor={"#fffa"}
      stroke={"white"}
      lineWidth={10}
      position={title.position()}
      end={0}
    ></Ray>
  );
  const numbers_decimal = (
    <Layout
      justifyContent={"center"}
      direction={"column"}
      alignItems={"center"}
      width={400}
      position={line().position().addX(-500).addY(24100)}
      gap={50}
      layout
    >
      {...range(256).map((i) => (
        <Txt
          scale={i <= 7 ? 0.3 : 1}
          opacity={i > 7 ? 1 : 0}
          fontSize={120}
          fill={"#e9ff44"}
          shadowBlur={20}
          shadowColor={"#ff05"}
        >
          {i.toString()}
        </Txt>
      ))}
    </Layout>
  );
  container.add(numbers_decimal);
  const numbers_binary = (
    <Layout
      justifyContent={"center"}
      alignItems={"center"}
      width={400}
      direction={"column"}
      position={line().position().addX(500).addY(24100)}
      gap={50}
      layout
    >
      {...range(256).map((i) => (
        <Txt
          scale={i <= 7 ? 0.3 : 1}
          opacity={i > 7 ? 1 : 0}
          fontSize={120}
          fill={"white"}
          shadowBlur={20}
          shadowColor={"#fff5"}
        >
          {i.toString(2)}
        </Txt>
      ))}
    </Layout>
  );
  container.add(numbers_binary);
  yield all(
    title.y(title.y() - 4000, 1, easeInCubic),
    title.opacity(0, 0.5, easeInCubic),
    line().end(1, 1)
  );
  yield sequence(
    0.1,
    ...numbers_decimal
      .children()
      .slice(0, 8)
      .map((c) =>
        all(c.opacity(1, 0.7, easeOutCubic), c.scale(1, 0.7, easeOutBack))
      )
  );
  yield* sequence(
    0.1,
    ...numbers_binary
      .children()
      .slice(0, 8)
      .map((c) =>
        all(c.opacity(1, 0.7, easeOutCubic), c.scale(1, 0.7, easeOutBack))
      )
  );
  yield* waitUntil("scroll");
  yield* all(
    numbers_binary.y(-numbers_binary.y() - 3500, 5),
    numbers_decimal.y(-numbers_decimal.y() - 3500, 5)
  );
  yield* waitUntil("sub");
  const subtitle = (
    <Txt x={600} y={-100} fontFamily={"Poppins"} fontSize={120} fill={"white"}>
      {`Subtraction circuit\nA - B = A + (~B + 1)`}
    </Txt>
  ) as Txt;
  subtitle.save();
  subtitle.text("");
  subtitle.x(2000);

  view.add(subtitle);
  yield* all(container.x(container.x() - 800, 1), subtitle.restore(2));

  // in davinci here will be a different scene put !!!
  yield* waitUntil("cut");
  line().remove();
  numbers_binary.remove();
  numbers_decimal.remove();
  subtitle.remove();

  const binary = (
    <Bitnumber number={6} bitgroups={2} showDecimal={1} scale={2} />
  ) as Bitnumber;
  view.add(binary);
  const steps = (
    <Rect layout direction={"column"} gap={30} y={200}>
      <Txt
        fontFamily={"Poppins"}
        fill={"#fffd"}
        shadowBlur={12}
        shadowColor={"#fff3"}
        fontSize={140}
        opacity={0}
        scale={0.7}
      >
        1. Invert the number
      </Txt>

      <Txt
        fontFamily={"Poppins"}
        fill={"#fffd"}
        shadowBlur={12}
        shadowColor={"#fff3"}
        fontSize={140}
        opacity={0}
        scale={0.7}
      >
        2. Add one
      </Txt>
    </Rect>
  );
  view.add(steps);

  yield* waitFor(0.5);
  yield all(
    container.stroke("#fff2", 2),
    view.fill(new Color(view.fill() as any).darken(), 2),
    bgr.opacity(0.2, 2)
  );
  yield* binary.pop();
  yield* waitUntil("~bits");
  yield* binary.y(binary.y() - 200, 1);
  yield all(
    steps.childAs<Txt>(0).scale(1,.4,easeOutCubic),
    steps.childAs<Txt>(0).opacity(1,.4,easeOutCubic),
  );
  binary.load(~6);
  yield* waitUntil("+1");
  yield all(
    steps.childAs<Txt>(1).scale(1,.4,easeOutCubic),
    steps.childAs<Txt>(1).opacity(1,.4,easeOutCubic),
  );
  binary.load(~6 + 1);
  yield* waitUntil("examples");
  binary.load(3)
  yield* all(
    steps.opacity(0,1),
    binary.y(0,1),
  );
  yield* waitUntil('solve');
  binary.load(~3);
  yield* waitFor(.8);
  binary.load(~3+1);


  yield* waitUntil("next");
});
