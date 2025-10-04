import {
  Circle,
  Layout,
  Line,
  makeScene2D,
  Rect,
  Txt,
  Ray,
  Code,
  lines,
  Node,
  Gradient,
} from "@motion-canvas/2d";
import {
  all,
  chain,
  createRefArray,
  DEFAULT,
  delay,
  easeInOutBack,
  easeInOutSine,
  easeInSine,
  easeOutBack,
  easeOutCubic,
  easeOutSine,
  loop,
  sequence,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { ShaderBackground } from "../components/background";
import {
  GlassCaption,
  GlowBadge,
  GlowPanelTitle,
} from "../components/TextPresets";
import { Glass } from "../components/GlassRect";
import { AsmHighlighter } from "../utils/AsmHighlighter";

const PUSH_STEPS = [
  {
    title: "Reserve stack space",
    detail: "SP <= SP - 1 carves out a fresh slot on the stack.",
  },
  {
    title: "Store the register",
    detail: "RAM[SP] <= R writes the selected register into that slot.",
  },
  {
    title: "Balance future POPs",
    detail: "Every PUSH grows the stack so a later POP can unwind it.",
  },
] as const;

const POP_STEPS = [
  {
    title: "Recover the value",
    detail: "R <= RAM[SP] loads whatever was recover pushed.",
  },
  {
    title: "Release the slot",
    detail: "SP <= SP + 1 moves the stack pointer back up.",
  },
  {
    title: "Mirror PUSH",
    detail: "POP reverses the process so the stack stays balanced.",
  },
] as const;

const CARD_WIDTH = 1080;
const CARD_PADDING = 56;
const CARD_GAP = 70;
const TITLE_Y = -690;
const PUSH_X = -1040;
const POP_X = 1040;
const TIMELINE_OFFSET = 860;
const CONNECTOR_LENGTH = TIMELINE_OFFSET - 170;
const CARD_BODY_WIDTH = CARD_WIDTH - 160;
const DETAIL_WIDTH = 420;
const DOT_RADIUS = 12;

export default makeScene2D(function* (view) {
  view.fill("#020712");
  view.fontFamily("Poppins");
  view.add(<ShaderBackground opacity={0.25} preset="cyberWave" />);

  const pushTitle = (
    <GlowPanelTitle
      initialVisibility={false}
      position={[PUSH_X, TITLE_Y]}
      textAlign="left"
    />
  ) as GlowPanelTitle;
  const popTitle = (
    <GlowPanelTitle
      initialVisibility={false}
      position={[POP_X, TITLE_Y]}
      textAlign="right"
    />
  ) as GlowPanelTitle;
  view.add(pushTitle);
  view.add(popTitle);

  const pushStepsRefs = createRefArray<Layout>();
  const popStepsRefs = createRefArray<Layout>();

  const pushTimelineX = PUSH_X + TIMELINE_OFFSET;
  const popTimelineX = POP_X - TIMELINE_OFFSET;

  const pushTimelineConnector = (
    <Line
      points={[
        [pushTimelineX, -1260],
        [pushTimelineX, 1260],
      ]}
      stroke="#5be7ff88"
      lineWidth={8}
      lineDash={[18, 24]}
      end={0}
    />
  ) as Line;
  const popTimelineConnector = (
    <Line
      points={[
        [popTimelineX, 1260],
        [popTimelineX, -1260],
      ]}
      stroke="#ffbf5b88"
      lineWidth={8}
      lineDash={[18, 24]}
      end={0}
    />
  ) as Line;
  view.add(pushTimelineConnector);
  view.add(popTimelineConnector);

  const pushTimeline = (
    <Layout
      layout
      direction="column"
      gap={CARD_GAP}
      x={PUSH_X}
      y={200}
      alignItems="start"
    >
      {PUSH_STEPS.map((step, index) => (
        <Layout
          ref={pushStepsRefs}
          layout
          direction="column"
          alignItems="start"
          gap={14}
          scale={0}
          opacity={0}
        >
          <Rect
            layout
            direction="column"
            alignItems="start"
            gap={22}
            radius={40}
            padding={CARD_PADDING}
            width={CARD_BODY_WIDTH}
            fill="#0c3056d9"
            stroke="#65e0ffaa"
            lineWidth={3}
          >
            <Layout layout alignItems="center" gap={32}>
              <GlowBadge text={`PUSH Step ${index + 1}`} fontSize={96} />
              <Ray
                fromX={0}
                toX={CONNECTOR_LENGTH}
                lineWidth={8}
                stroke="#5be7ff88"
              />
            </Layout>
            <Txt
              fontSize={70}
              fill="#f8fbff"
              fontWeight={700}
              text={step.title}
            />
          </Rect>
          <GlassCaption
            text={step.detail}
            fontSize={46}
            width={DETAIL_WIDTH}
            textAlign="left"
          />
          <Circle
            size={DOT_RADIUS * 4}
            fill="#5be7ff"
            stroke="#5be7ff88"
            layout={false}
            lineWidth={4}
            position={[CONNECTOR_LENGTH + 170, -(CARD_PADDING + 30)]}
          />
        </Layout>
      ))}
    </Layout>
  );

  const popTimeline = (
    <Layout
      layout
      direction="column"
      gap={CARD_GAP}
      x={POP_X}
      y={200}
      alignItems="end"
    >
      {POP_STEPS.slice()
        .reverse()
        .map((step, reversedIndex) => {
          const stepNumber = POP_STEPS.length - reversedIndex;
          return (
            <Layout
              ref={popStepsRefs}
              layout
              direction="column"
              alignItems="end"
              gap={14}
              scale={0}
              opacity={0}
            >
              <Rect
                layout
                direction="column"
                alignItems="end"
                gap={22}
                radius={40}
                padding={CARD_PADDING}
                width={CARD_BODY_WIDTH}
                fill="#5c260cd9"
                stroke="#ffbf5baa"
                lineWidth={3}
              >
                <Layout layout alignItems="center" gap={32}>
                  <Ray
                    fromX={0}
                    toX={
                      -CONNECTOR_LENGTH - 200 + (reversedIndex == 2 ? -30 : 0)
                    }
                    lineWidth={8}
                    stroke="#ffbf5b88"
                  />
                  <GlowBadge text={`POP Step ${stepNumber}`} fontSize={96} />
                </Layout>
                <Txt
                  fontSize={54}
                  fill="#fff6ea"
                  fontWeight={700}
                  text={step.title}
                />
              </Rect>
              <GlassCaption
                text={step.detail}
                fontSize={46}
                textAlign="right"
              />
              <Circle
                size={DOT_RADIUS * 4}
                fill="#ffbf5b"
                stroke="#ffbf5b88"
                lineWidth={4}
                layout={false}
                position={[
                  -CONNECTOR_LENGTH -
                    110 -
                    (reversedIndex == 0 ? 50 : reversedIndex == 1 ? 160 : 100),
                  -(CARD_PADDING + 20),
                ]}
              />
            </Layout>
          );
        })}
    </Layout>
  );

  view.add(pushTimeline);
  view.add(popTimeline);

  yield* waitUntil("begin");

  yield* waitUntil("push intro");
  yield* all(pushTitle.popIn("PUSH R", 0.6));

  yield pushTimelineConnector.end(1, 1, easeOutCubic);
  yield* waitFor(1.5);
  yield* sequence(
    0.35,
    ...pushStepsRefs.map((container) =>
      all(
        container.scale(1, 0.65, easeOutBack),
        container.opacity(1, 0.55, easeOutCubic)
      )
    )
  );

  yield* waitUntil("pop intro");
  yield* all(
    popTitle.popIn("POP R", 0.6),
    popTimelineConnector.end(1, 0.6, easeOutCubic)
  );

  yield* sequence(
    0.35,
    ...popStepsRefs.map((container) =>
      all(
        container.scale(1, 0.65, easeOutBack),
        container.opacity(1, 0.55, easeOutCubic)
      )
    )
  );

  const items = view
    .children()
    .filter((child) => !(child instanceof ShaderBackground));
  const code = (
    <Glass size={[3600, 2200]} translucency={1} borderModifier={-1} y={3000}>
      <Code
        zIndex={1}
        fontSize={80}
        width={1800}
        top={[-1000, -20]}
        height={600}
        highlighter={new AsmHighlighter()}
        code={`\

; --- Main Program ---
PUSH R0     
PUSH R1        
CALL ADD_FN      
POP  R2          
HLT

; --- Function: ADD_FN ---
ADD_FN:
  PUSH BP        
  MOV  BP, SP

  MOV  R3, [BP + 3]   
  MOV  R4, [BP + 2]   
  ADD  R3, R4         

  MOV  [BP + 2], R3   

  MOV  SP, BP         
  POP  BP
  RET`}
      />
    </Glass>
  ) as Glass;
  view.add(code);

  yield code.y(-500, 2, easeOutCubic);
  yield* all(...items.map((item) => item.opacity(0.1, 1)));
  yield* all(code.scale(0.7, 1), code.position(0, 1));

  yield* waitUntil("highlight1");
  yield* all(
    code
      .childAs<Code>(0)
      .selection(code.childAs<Code>(0).findFirstRange("MOV  BP, SP"), 0.4),
    code.scale(2, 1),
    code.position([1500, 0], 1)
  );
  yield* waitUntil("highlight return");
  yield* all(
    code.childAs<Code>(0).selection(DEFAULT, 0.4),
    code.position([200, -800], 1),
    code.scale(1.3, 1)
  );
  yield* waitUntil("restore code");
  yield* all(
    code.scale(0.6, 1),
    code.position(0, 1),
    loop(8, (i) =>
      code.childAs<Code>(0).selection(lines(i * 3 - 3, i * 3), 0.2)
    )
  );
  yield* code.childAs<Code>(0).selection(DEFAULT, 0.5);

  yield* waitUntil("skip chapter");
  const chapters = { intro: 0.05, fpu: 0.2, stack: 0.5, cache: 0.95, outro: 1 };
  const timings = Object.values(chapters);
  const video_timeline = (
    <Node y={1400}>
      <Ray
        stroke={
          new Gradient({
            fromY: -30,
            toY: 30,
            stops: [
              { offset: 0, color: "#f00" },
              { offset: 1, color: "#f55" },
            ],
          })
        }
        end={0}
        fromX={-1800}
        toX={1800}
        lineWidth={20}
        zIndex={1}
      >
        <Circle
          size={60}
          position={() =>
            video_timeline
              .childAs<Ray>(0)
              .getPointAtPercentage(video_timeline.childAs<Ray>(0).end())
              .position
          }
          fill={
            new Gradient({
              fromY: -30,
              toY: 30,
              stops: [
                { offset: 0, color: "#f00" },
                { offset: 1, color: "#f55" },
              ],
            })
          }
        />
      </Ray>
      {...timings.map((val, i) => (
        <Ray
          stroke={"#fffa"}
          from={() =>
            video_timeline
              .childAs<Ray>(0)
              .getPointAtPercentage(i > 0 ? timings[i - 1] : 0).position
          }
          to={() =>
            video_timeline.childAs<Ray>(0).getPointAtPercentage(val).position
          }
          shadowBlur={50}
          startOffset={20}
          endOffset={20}
          shadowColor={"#000"}
          lineWidth={15}
        ></Ray>
      ))}
    </Node>
  );
  view.add(video_timeline);
  yield* video_timeline.y(800, 1);
  yield* video_timeline.childAs<Ray>(0).end(chapters.stack, 1.5, easeInOutSine);
  yield* video_timeline.y(1400, 1).do(() => video_timeline.remove());

  const rules = createRefArray<Rect>();

  const assumptions = (
    <Glass
      size={[1200, 1600]}
      x={3000}
      padding={80}
      radius={56}
      shadowBlur={140}
      shadowColor={"#020b1cdd"}
      zIndex={1}
    >
      <Txt
        fontSize={58}
        fontWeight={600}
        fill={"#8bb7ff"}
        letterSpacing={4}
        opacity={0.9}
        y={-540}
        zIndex={1}
      >
        I&apos;LL ASSUME
      </Txt>
      <Txt
        fontSize={120}
        fontWeight={800}
        fill={"#ffffff"}
        y={-440}
        shadowBlur={60}
        shadowColor={"#5be7ff55"}
        zIndex={1}
      >
        STACK RULES
      </Txt>
      {[
        {
          title: "Stack grows downward",
          detail:
            "Each PUSH decrements SP by one slot; each POP increments it.",
          accent: "#5be7ff",
          badge: "SP",
        },
        {
          title: "CALL pushes return address",
          detail: "CALL foo pushes the return address before the jump to foo.",
          accent: "#ffbf5b",
          badge: "<-",
        },
        {
          title: "RET pops into PC",
          detail: "RET pops that return address back into the program counter.",
          accent: "#ff6bcb",
          badge: "PC",
        },
        {
          title: "One slot per cell",
          detail:
            "Treat a slot as a single stack cell; skip byte versus word details.",
          accent: "#9d7bff",
          badge: "[]",
        },
      ].map(({ title, detail, accent, badge }, index) => (
        <Rect
          ref={rules}
          width={960}
          height={220}
          y={-200 + index * 240}
          radius={48}
          fill={"rgba(8, 16, 35, 0.85)"}
          stroke={`${accent}55`}
          lineWidth={2}
          shadowBlur={90}
          shadowColor={`${accent}33`}
          zIndex={1}
        >
          <Circle
            size={140}
            position={[-340, 0]}
            fill={`${accent}26`}
            stroke={accent}
            lineWidth={6}
            shadowBlur={60}
            shadowColor={`${accent}55`}
            zIndex={1}
          >
            <Txt
              fontSize={48}
              fontWeight={700}
              fill={"#ffffff"}
              letterSpacing={2}
              zIndex={1}
            >
              {badge}
            </Txt>
          </Circle>
          <Txt
            fontSize={43}
            fontWeight={700}
            fill={"#ffffff"}
            position={[60, -60]}
            width={600}
            lineHeight={70}
            shadowBlur={32}
            shadowColor={`${accent}44`}
            zIndex={1}
          >
            {title}
          </Txt>
          <Txt
            fontSize={32}
            fontWeight={500}
            fill={"#c4d6ff"}
            opacity={0.95}
            position={[80, 20]}
            width={640}
            lineHeight={54}
            textWrap
            zIndex={1}
          >
            {detail}
          </Txt>
        </Rect>
      ))}
    </Glass>
  );
  view.add(assumptions);

  yield* waitUntil("assumptions");
  yield* all(
    code.x(0, 1),
    code.scale([0.3, 0.5], 1),
    assumptions.x(0, 1),
    assumptions.scale(1.2, 1)
  );

  yield* sequence(
    0.3,
    ...rules.map((rule) =>
      chain(
        all(
          rule.scale(1.1, 0.8, easeInOutBack),
          rule.shadowBlur(50, 0.8, easeInOutBack)
        ),
        all(
          rule.scale(1, 0.6, easeInOutSine),
          rule.shadowBlur(90, 0.6, easeInOutSine)
        )
      )
    )
  );

  yield* waitUntil("next");
});
