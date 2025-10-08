import { Code, Rect, makeScene2D } from "@motion-canvas/2d";
import { ShaderBackground } from "../components/background";
import {
  createSignal,
  easeInOutBack,
  SignalValue,
  waitUntil,
  useRandom,
} from "@motion-canvas/core";
import { Glass } from "../components/GlassRect";
import { GlassBodyText, GlowPanelTitle } from "../components/TextPresets";
import { AsmHighlighter } from "../utils/AsmHighlighter";

export default makeScene2D(function* (view) {
  view.fill("rgba(8, 1, 2, 1)");
  view.add(<ShaderBackground opacity={0.25} preset="cyberWave" />);
  const register_signal = createSignal<number>(0);
  const stackHeight = () => 850 - 150 * register_signal();
  const stackHeaderHeight = 200;
  const random = useRandom();
  const randomBits = (bits: number) =>
    random.nextInt(0, 1 << bits).toString(2).padStart(bits, "0");
  const formatStackValue = () => `${randomBits(2)}.${randomBits(2)}`;

  const registers: {
    name: SignalValue<string>;
    represents: SignalValue<string>;
  }[] = [
    {
      name: createSignal<string>("R0"),
      represents: "Arg0/ACC",
    },
    {
      name: "R1",
      represents: "Arg1",
    },
    {
      name: "R2",
      represents: "Scratch",
    },
    {
      name: "PC",
      represents: "Next PC",
    },
    {
      name: "BP",
      represents: "Frame base",
    },
    {
      name: "SP",
      represents: "Stack top",
    },
  ];

  const stackEntryBases: {
    address: string;
    note: string;
    highlight?: boolean;
  }[] = [
    {
      address: "100",
      note: "CALL pushes resume point",
    },
    {
      address: "099",
      note: "Restore caller frame",
    },
    {
      address: "098",
      note: "First argument",
      highlight: true,
    },
    {
      address: "097",
      note: "Second argument",
      highlight: true,
    },
    {
      address: "096",
      note: "Temp slot",
    },
  ];
  const stackEntries = stackEntryBases.map((entry) => ({
    ...entry,
    content: formatStackValue(),
  }));

  const code_rect = (
    <Glass size={[1700, 1300]} x={-900} y={-100}>
      <Code
        zIndex={2}
        fontSize={40}
        width={820}
        height={560}
        top={[-180, -10]}
        highlighter={new AsmHighlighter()}
        code={`\

; --- Main Program ---
PUSH R0         ; Push first number (3)
PUSH R1         ; Push second number (5)

CALL ADD_FN     ; Jump to function with args on stack

POP  R2         ; Retrieve result into R2
HLT             ; Halt execution

; --- Function: ADD_FN ---
ADD_FN:
  PUSH BP       ; Preserve caller frame
  MOV  BP, SP   ; Start a new stack frame

  MOV  R3, [BP + 2] ; Load first argument
  MOV  R4, [BP + 1] ; Load second argument
  ADD  R3, R4       ; R3 = arg0 + arg1

  MOV  [BP + 2], R3 ; Store result in caller slot

  MOV  SP, BP   ; Tear down frame
  POP  BP       ; Restore caller frame
  RET           ; Return to caller`}
      />
    </Glass>
  ) as Glass;

  const stack_view = (
    <Glass
      size={() => [1700, stackHeight()]}
      x={900}
      y={() => 400 * register_signal()}
    >
      <GlassBodyText
        text={"Address"}
        fontSize={46}
        fontWeight={600}
        textAlign={"left"}
        x={-540}
        y={() => -stackHeight() / 2 + 70}
        zIndex={2}
      />
      <GlassBodyText
        text={"Value"}
        fontSize={46}
        fontWeight={600}
        textAlign={"center"}
        x={-40}
        y={() => -stackHeight() / 2 + 70}
        zIndex={2}
      />
      <GlassBodyText
        text={"Notes"}
        fontSize={46}
        fontWeight={600}
        textAlign={"right"}
        x={520}
        y={() => -stackHeight() / 2 + 70}
        zIndex={2}
      />
      <Rect
        zIndex={1}
        size={() => [1600, stackHeight() - stackHeaderHeight + 100]}
        y={() => stackHeaderHeight / 2 - 50}
        clip
        lineWidth={0}
      >
        {stackEntries.flatMap((entry, index) => {
          const rowY = () =>
            -((stackHeight() - stackHeaderHeight) / 2) + 40 + index * 140;
          return [
            <Glass
              key={`${entry.address}-addr`}
              zIndex={2}
              lightness={0.1}
              translucency={0.9}
              size={[420, 120]}
              x={-540}
              y={rowY}
            >
              <GlassBodyText
                text={entry.address}
                fontSize={52}
                fontWeight={600}
                textAlign={"left"}
                zIndex={2}
              />
            </Glass>,
            <Glass
              key={`${entry.address}-value`}
              zIndex={2}
              lightness={0}
              translucency={entry.highlight ? 1 : 0.85}
              size={[360, 120]}
              x={-40}
              y={rowY}
              fill={entry.highlight ? "#154d91aa" : undefined}
            >
              <GlassBodyText
                text={entry.content}
                fontSize={52}
                fontWeight={600}
                textAlign={"center"}
                fill={entry.highlight ? "#bfe4ff" : "#ffffff"}
                zIndex={2}
              />
            </Glass>,
            <Glass
              key={`${entry.address}-note`}
              zIndex={2}
              lightness={0.1}
              translucency={0.9}
              size={[520, 120]}
              x={520}
              y={rowY}
            >
              <GlassBodyText
                text={entry.note}
                fontSize={40}
                opacity={0.85}
                textAlign={"center"}
                fill={entry.highlight ? "#9ed6ff" : "#cce3ff"}
                width={480}
                textWrap
                zIndex={2}
              />
            </Glass>,
          ];
        })}
      </Rect>
    </Glass>
  );
  const register_space = (
    <Glass
      size={() => [1000 + 700 * register_signal(), 700 * register_signal()]}
      x={900}
      y={() => -400 * register_signal()}
      clip
    >
      <GlowPanelTitle
        text={"Reg summary"}
        opacity={0.85}
        fontWeight={600}
        y={-250}
        fontSize={96}
        zIndex={2}
      />
      {...registers.map((register, i) => (
        <Glass
          zIndex={1}
          lightness={-0.2}
          translucency={1}
          size={[740, 130]}
          x={i % 2 == 0 ? -400 : 400}
          y={-50 + Math.floor(i / 2) * 150}
        >
          <GlassBodyText
            text={register.name}
            width={690}
            fontSize={60}
            fontWeight={600}
            textAlign={"left"}
            zIndex={1}
          ></GlassBodyText>
          <GlassBodyText
            text={register.represents}
            opacity={0.8}
            fontSize={48}
            width={690}
            textAlign={"right"}
            zIndex={1}
          ></GlassBodyText>
        </Glass>
      ))}
    </Glass>
  );
  const context_view = (
    <Glass width={1700} height={150} top={code_rect.bottom().addY(50)}>
      <GlassBodyText
        text={
          "CALL saves return + BP so RET restores the frame cleanly."
        }
        width={1500}
        left={[-850 + 50, 0]}
        fontSize={54}
        opacity={0.9}
        zIndex={2}
      />
    </Glass>
  );

  view.add(code_rect);
  view.add(stack_view);
  view.add(register_space);
  view.add(context_view);

  function* showRegisters() {
    yield* register_signal(1, 2, easeInOutBack);
  }

  yield* waitUntil("begin");

  yield* showRegisters();

  yield* waitUntil("next");
});

