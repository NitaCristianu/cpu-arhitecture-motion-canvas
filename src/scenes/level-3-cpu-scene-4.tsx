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

const CALL_STEPS = [
  {
    title: "Push return address",
    detail: "Stack <= PC + 1 so we know where to come back.",
  },
  {
    title: "Save caller frame",
    detail: "Push BP, then move BP to the current SP.",
  },
  {
    title: "Jump to function",
    detail: "PC <= addr and execution continues inside the callee.",
  },
] as const;

const RET_STEPS = [
  {
    title: "Restore base pointer",
    detail: "BP <= stack.pop(), recovering the caller frame.",
  },
  {
    title: "Pop return address",
    detail: "Take the saved PC off the stack.",
  },
  {
    title: "Resume caller",
    detail: "PC <= return address and the caller continues running.",
  },
] as const;

const CARD_WIDTH = 1080;
const CARD_PADDING = 56;
const CARD_GAP = 70;
const TITLE_Y = -690;
const CALL_X = -1040;
const RET_X = 1040;
const TIMELINE_OFFSET = 860;
const CONNECTOR_LENGTH = TIMELINE_OFFSET - 170;
const CARD_BODY_WIDTH = CARD_WIDTH - 160;
const DETAIL_WIDTH = 420;
const DOT_RADIUS = 12;

export default makeScene2D(function* (view) {
  view.fill("#020712");
  view.fontFamily("Poppins");
  view.add(<ShaderBackground opacity={0.25} preset="cyberWave" />);

  const callTitle = (
    <GlowPanelTitle
      initialVisibility={false}
      position={[CALL_X, TITLE_Y]}
      textAlign="left"
    />
  ) as GlowPanelTitle;
  const retTitle = (
    <GlowPanelTitle
      initialVisibility={false}
      position={[RET_X, TITLE_Y]}
      textAlign="right"
    />
  ) as GlowPanelTitle;
  view.add(callTitle);
  view.add(retTitle);

  const callStepsRefs = createRefArray<Layout>();
  const retStepsRefs = createRefArray<Layout>();

  const callTimelineX = CALL_X + TIMELINE_OFFSET ;
  const retTimelineX = RET_X - TIMELINE_OFFSET;

  const timelineConnectorLeft = (
    <Line
      points={[
        [callTimelineX, -1260],
        [callTimelineX, 1260],
      ]}
      stroke="#5be7ff88"
      lineWidth={8}
      lineDash={[18, 24]}
      end={0}
    />
  ) as Line;
  const timelineConnectorRight = (
    <Line
      points={[
        [retTimelineX, 1260],
        [retTimelineX, -1260],
      ]}
      stroke="#ffbf5b88"
      lineWidth={8}
      lineDash={[18, 24]}
      end={0}
    />
  ) as Line;
  view.add(timelineConnectorLeft);
  view.add(timelineConnectorRight);

  const callTimeline = (
    <Layout
      layout
      direction="column"
      gap={CARD_GAP}
      x={CALL_X}
      y={200}
      alignItems="start"
    >
      {CALL_STEPS.map((step, index) => (
        <Layout
          ref={callStepsRefs}
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
              <GlowBadge text={`CALL Step ${index + 1}`} fontSize={96} />
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

  const retTimeline = (
    <Layout
      layout
      direction="column"
      gap={CARD_GAP}
      x={RET_X}
      y={200}
      alignItems="end"
    >
      {RET_STEPS.slice()
        .reverse()
        .map((step, reversedIndex) => {
          const stepNumber = RET_STEPS.length - reversedIndex;
          return (
            <Layout
              ref={retStepsRefs}
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
                  <GlowBadge text={`RET Step ${stepNumber}`} fontSize={96} />
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
                position={[-CONNECTOR_LENGTH-110 - ((reversedIndex==0) ? 50 : (reversedIndex == 1) ? 235 :155), -(CARD_PADDING + 20)]}
              />
            </Layout>
          );
        })}
    </Layout>
  );

  view.add(callTimeline);
  view.add(retTimeline);

  yield* waitUntil("begin");

  yield* waitUntil("call intro");
  yield* all(callTitle.popIn("CALL [addr]", 0.6));

  yield timelineConnectorLeft.end(1, 1, easeOutCubic);
  yield* waitFor(1.5);
  yield* sequence(
    0.35,
    ...callStepsRefs.map((container) =>
      all(
        container.scale(1, 0.65, easeOutBack),
        container.opacity(1, 0.55, easeOutCubic),
      )
    )
  );

  yield* waitUntil("ret intro");
  yield* all(
    retTitle.popIn("RET", 0.6),
    timelineConnectorRight.end(1, 0.6, easeOutCubic)
  );

  yield* sequence(
    0.35,
    ...retStepsRefs.map((container) =>
      all(
        container.scale(1, 0.65, easeOutBack),
        container.opacity(1, 0.55, easeOutCubic)
      )
    )
  );

  yield* waitUntil("next");
});
