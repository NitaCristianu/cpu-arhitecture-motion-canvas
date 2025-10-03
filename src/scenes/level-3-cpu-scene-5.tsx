import {
  Circle,
  Layout,
  Line,
  makeScene2D,
  Rect,
  Txt,
  Ray,
} from "@motion-canvas/2d";
import {
  all,
  createRefArray,
  delay,
  easeOutBack,
  easeOutCubic,
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

  const pushTimelineX = PUSH_X + TIMELINE_OFFSET ;
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
            position={[CONNECTOR_LENGTH+170, -(CARD_PADDING+30)]}
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
                    toX={-CONNECTOR_LENGTH-200 + (reversedIndex == 2 ? -30 : 0)}
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
                position={[-CONNECTOR_LENGTH-110 - ((reversedIndex==0) ?50 : (reversedIndex == 1) ? 160 :100), -(CARD_PADDING + 20)]}
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
        container.opacity(1, 0.55, easeOutCubic),
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

  yield* waitUntil("next");
});
