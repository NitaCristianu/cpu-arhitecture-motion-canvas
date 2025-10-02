import {
  Circle,
  Code,
  Gradient,
  Grid,
  Icon,
  Layout,
  Line,
  lines,
  makeScene2D,
  Rect,
  Txt,
  Ray,
} from "@motion-canvas/2d";
import {
  all,
  chain,
  createSignal,
  easeInBack,
  easeOutBack,
  easeOutCubic,
  PossibleVector2,
  range,
  sequence,
  useRandom,
  waitUntil,
  Vector2,
  delay,
  createRefArray,
  any,
  easeInOutQuad,
  createRef,
  waitFor,
  easeOutSine,
  Color,
} from "@motion-canvas/core";
import { ShaderBackground } from "../components/background";
import { Glass } from "../components/GlassRect";
import { AsmHighlighter } from "../utils/AsmHighlighter";
import {
  GlassBodyText,
  GlassCaption,
  GlowBadge,
  GlowPanelTitle,
} from "../components/TextPresets";
import { CPP_Highlight } from "../utils/CodeHighlighter";

export default makeScene2D(function* (view) {
  view.fill("#000");
  view.add(<ShaderBackground opacity={0.2} preset="cyberWave" />);
  view.fontFamily("Poppins");

  const generator = useRandom(1);

  const cpu = (
    <Circle
      stroke={"white"}
      scale={0.5}
      opacity={0}
      lineDash={[90, 30]}
      lineWidth={10}
      size={900}
      shadowBlur={30}
      shadowColor={"#fff5"}
    >
      <Icon
        icon={"mdi:chip"}
        y={-50}
        shadowBlur={30}
        shadowColor={"#fff5"}
        size={500}
      />
      <Txt
        text={"CPU"}
        y={250}
        fontSize={120}
        shadowBlur={30}
        shadowColor={"#fff5"}
        fill={"white"}
      />
    </Circle>
  ) as Circle;
  view.add(cpu);

  const code = (
    <Glass
      size={[1800, 800]}
      x={-800}
      scaleY={0}
      translucency={1}
      borderModifier={-1}
    >
      <Code
        zIndex={1}
        fontSize={80}
        width={1800}
        top={[-300, -20]}
        height={600}
        code={`\
section .text
global add_two_numbers

add_two_numbers:
    add     rdi, rsi
    mov     rax, rdi
    ret`}
      ></Code>
    </Glass>
  ) as Glass;
  view.add(code);

  yield* waitUntil("begin");
  yield* sequence(
    0.5,
    all(code.scale(1, 0.7, easeOutBack)),
    all(
      cpu.scale(1, 0.7, easeOutBack),
      cpu.opacity(1, 0.7, easeOutCubic),
      cpu.x(1250, 0.7, easeOutBack)
    )
  );
  yield code.childAs<Code>(0).selection(lines(3, 9), 0.4);

  const arrows = range(10).map(
    (i) =>
      (
        <Line
          points={[
            code.right(),
            code
              .right()
              .addX(generator.nextInt(200, 900))
              .addY(generator.nextInt(-500, 900)),
            cpu.left(),
          ]}
          stroke={
            new Gradient({
              to: new Vector2(-500, 50),
              from: new Vector2(500, -50),
              stops: [
                {
                  offset: 0,
                  color: "#fff2",
                },
                {
                  offset: 1,
                  color: "#fff",
                },
              ],
            })
          }
          endArrow
          startOffset={40}
          endOffset={40}
          lineWidth={15}
          radius={400}
          lineDash={[20, 20]}
          end={0}
        />
      ) as Line
  );
  arrows.forEach((arr) => view.add(arr));
  yield sequence(
    0.2,
    ...arrows.map((arr) =>
      chain(arr.end(1, 0.6, easeOutCubic), arr.start(1, 0.6, easeOutCubic))
    )
  );

  yield* waitUntil("enter cpu");
  const children = view
    .children()
    .filter((c) => !(c instanceof ShaderBackground));
  yield* all(...children.map((child) => child.x(child.x() - 1250, 1)));

  const cellsize = createSignal(300);
  const stackTop = createSignal<PossibleVector2>([0, -cellsize() * 2]);
  const sp = createSignal(4);

  const addresses = createRefArray<GlassBodyText>();
  const values = createRefArray<GlowBadge>();

  const stack = (
    <Rect
      fill={"#83e4f639"}
      shadowColor={"83e4f669"}
      shadowBlur={100}
      stroke={"#c7ebffff"}
      lineWidth={3}
      radius={32}
      width={cellsize()}
      height={() => sp() * cellsize()}
      scale={0}
      opacity={0.5}
      top={stackTop}
      clip
    >
      <Grid
        offset={0.5}
        size={() => stack.size().mul(2)}
        spacing={cellsize()}
        stroke={"#c7ebff"}
        lineWidth={3}
      />
      {...range(20).map((i) => (
        <GlassBodyText
          ref={addresses}
          initialVisibility={false}
          opacity={0.4}
          fontFamily={"Fira Code"}
          fontSize={32}
          // bottom={() => }
        ></GlassBodyText>
      ))}
      {...range(20).map((i) => (
        <GlowBadge
          ref={values}
          initialVisibility={false}
          opacity={0.4}
          fontFamily={"Fira Code"}
          fontSize={32}
          // position={() => [0, stack.top().y + cellsize() * i + cellsize() / 2]}
        ></GlowBadge>
      ))}
    </Rect>
  ) as Rect;
  addresses.forEach((txt, i) =>
    txt.absolutePosition(() =>
      new Vector2(
        stack.absolutePosition().x,
        cellsize() * i + cellsize() * 2 + cellsize() / 2 - 50 * stack.scale().y
      )
        .addY(stack.top().y)
        .mul([1, stack.scale().y])
    )
  );
  values.forEach((txt, i) =>
    txt.absolutePosition(() =>
      new Vector2(
        stack.absolutePosition().x,
        cellsize() * i + cellsize() - 20 * stack.scale().y
      )
        .addY(stack.top().y)
        .mul([1, stack.scale().y])
    )
  );
  const memoryTitle = (
    <GlowPanelTitle initialVisibility={false} bottom={stack.top().addY(-200)} />
  ) as GlowPanelTitle;
  view.add(memoryTitle);
  view.add(stack);

  // enter cpu
  yield* any(
    ...children.map((c) =>
      all(
        c.scale(8, 0.8, easeInBack),
        c.opacity(0, 0.8).do(() => c.remove())
      )
    ),
    delay(
      0.4,
      all(stack.opacity(1, 0.8, easeOutCubic), stack.scale(1, 1, easeOutBack))
    )
  );

  yield* sequence(
    0.1,
    memoryTitle.popIn("Stack memory", 0.5),
    ...addresses.map((address) =>
      address.popIn(generator.nextInt(0, 32).toString(2).padEnd(8, "0"))
    ),
    ...values.map((address) =>
      address.popIn(
        generator.nextInt(0, 8).toString(2).padEnd(3, "0") +
          "..." +
          generator.nextInt(0, 8).toString(2).padEnd(3, "0")
      )
    )
  );
  yield* sp(3, 1);
  yield delay(
    1,
    all(
      memoryTitle.y(-2000, 1, easeOutCubic),
      stack.y(-1000, 1),
      stack.scale(2, 1, easeInOutQuad)
    )
  );
  yield* sp(12, 3);

  memoryTitle.text("Stack");
  yield* waitUntil("restore");
  yield* all(
    stack.scale(1, 2),
    stack.top(stackTop, 2),
    sp(4, 2),
    memoryTitle.y(-800, 2, easeOutCubic)
  );

  const sp_pos = values[1].y();

  const BP_mark = createRef<Layout>();
  const SP_mark = createRef<Layout>();

  view.add(
    <Layout
      layout
      left={[stack.right().addX(230).x, values[Math.floor(3)].y()]}
      scale={0}
      alignItems={"center"}
      ref={BP_mark}
    >
      <Ray
        fromX={200}
        startOffset={50}
        endArrow
        stroke={"white"}
        lineWidth={5}
      />
      <GlowBadge text="BP" />
    </Layout>
  );
  view.add(
    <Layout
      layout
      right={() => [stack.left().addX(-50).x, values[Math.floor(2 + sp())].y()]}
      scale={0}
      alignItems={"center"}
      ref={SP_mark}
    >
      <GlowBadge text="SP" />
      <Ray
        fromX={-200}
        startOffset={50}
        endArrow
        stroke={"white"}
        lineWidth={5}
      />
    </Layout>
  );

  yield BP_mark().scale(1, 1);
  yield* SP_mark().scale(1, 1);

  yield* waitUntil("base pointer");
  yield BP_mark()
    .x(BP_mark().x() - 30, 0.5)
    .back(0.5);
  yield* waitUntil("stack pointer");
  yield SP_mark()
    .x(SP_mark().x() + 30, 0.5)
    .back(0.5);

  yield SP_mark().right(
    () => [
      stack.left().addX(-50).x,
      values[Math.floor(8)].y() - cellsize() / 2,
    ],
    1
  );
  yield sp(5, 1);
  yield* waitFor(1);
  yield SP_mark().right(
    () => [
      stack.left().addX(-50).x,
      values[Math.floor(9)].y() + cellsize() / 2,
    ],
    1
  );
  yield sp(6, 1);
  yield* waitFor(1);
  yield SP_mark().right(
    () => [
      stack.left().addX(-50).x,
      values[Math.floor(10)].y() - cellsize() / 2,
    ],
    1
  );
  yield sp(4, 1);
  yield SP_mark().right(
    () => [stack.left().addX(-50).x, values[Math.floor(6)].y()],
    1
  );
  yield* waitFor(1);

  yield* waitUntil("nest");
  yield stack.x(-1100, 1);
  yield* BP_mark().x(BP_mark().x() - 1100, 1);

  const nested_code = (
    <Glass
      size={[1800, 900]}
      x={700}
      scaleY={0}
      translucency={1}
      borderModifier={-1}
    >
      <Code
        zIndex={1}
        fontSize={80}
        width={1800}
        top={[-100, -20]}
        height={900}
        highlighter={CPP_Highlight}
        code={`\
int inner(){ return 42; }

int outer(){ return inner() + 1; }

int main(){\n  cout << outer() << endl;\n}`}
      ></Code>
    </Glass>
  ) as Glass;
  view.add(nested_code);

  const accent = "#e7e053ff";

  const mainrange = createSignal(() => {
    const range = nested_code.childAs<Code>(0).findFirstRange(`int main()`);
    const bboxes = nested_code.childAs<Code>(0).getSelectionBBox(range);
    // "getSelectionBBox" returns an array of bboxes,
    // one for each line in the range. You can just
    // use the first one for this example.
    const first = bboxes[0];
    return first.expand([8, 46]);
  });
  const outerrange = createSignal(() => {
    const range = nested_code.childAs<Code>(0).findFirstRange(`int outer()`);
    const bboxes = nested_code.childAs<Code>(0).getSelectionBBox(range);
    // "getSelectionBBox" returns an array of bboxes,
    // one for each line in the range. You can just
    // use the first one for this example.
    const first = bboxes[0];
    return first.expand([8, 46]);
  });

  const main_function_rect = (
    <Rect
      fill={"#fff4"}
      shadowBlur={40}
      shadowColor={"#efefefae"}
      scale={0}
      stroke={"#fffa"}
      lineWidth={3}
      lineDash={[20, 20]}
      position={mainrange().position.addX(-60).addY(-5)}
      radius={32}
      size={mainrange().size}
      offset={-1}
    ></Rect>
  );
  const outer_function_rect = (
    <Rect
      fill={"#ff04"}
      shadowBlur={40}
      shadowColor={"#f2fa86a8"}
      scale={0}
      stroke={"#f6f6acaa"}
      lineWidth={3}
      lineDash={[20, 20]}
      radius={32}
      position={outerrange().position.addX(-60).addY(-5)}
      size={outerrange().size}
      offset={-1}
    ></Rect>
  );
  nested_code.add(main_function_rect);
  nested_code.add(outer_function_rect);

  const bp_layer_1 = BP_mark().clone({ opacity: 0 });
  bp_layer_1.absolutePosition(() => BP_mark().absolutePosition());
  bp_layer_1.childAs<Ray>(0).stroke(accent);
  bp_layer_1.childAs<Txt>(1).fill(accent);
  bp_layer_1.childAs<Txt>(1).shadowColor(new Color(accent).alpha(0.5));

  const sp_layer_1 = SP_mark().clone({ opacity: 0 });
  sp_layer_1.absolutePosition(() => SP_mark().absolutePosition());
  sp_layer_1.childAs<Ray>(1).stroke(accent);
  sp_layer_1.childAs<Txt>(0).fill(accent);
  sp_layer_1.childAs<Txt>(0).shadowColor(new Color(accent).alpha(0.5));

  view.add(bp_layer_1);
  view.add(sp_layer_1);

  yield* nested_code.scale(1, 0.5);
  yield sp(10, 1);
  yield stack.y(stack.y() + 50, 1);
  yield BP_mark().position(BP_mark().position().add([-100, -170]), 1);
  yield SP_mark().position(SP_mark().position().add([80, 270]), 1);
  yield main_function_rect.scale(1,.7,easeOutCubic);
  yield* stack.scale(0.5, 1);

  yield* waitUntil("outer call");
  yield bp_layer_1.opacity(1, 0.7, easeOutCubic);
  yield sp_layer_1.opacity(1, 0.7, easeOutCubic);
  yield bp_layer_1.scale(0.6, 1);
  yield sp_layer_1.scale(0.6, 1);
  yield bp_layer_1.x(bp_layer_1.x() - 70, 1);
  yield sp_layer_1.x(sp_layer_1.x() + 90, 1);
  yield bp_layer_1.y(bp_layer_1.y() + cellsize(), 1);
  yield sp_layer_1.y(sp_layer_1.y() - cellsize(), 1);
  yield outer_function_rect.scale(1,.7,easeOutCubic);

  yield* waitUntil("next");
});
