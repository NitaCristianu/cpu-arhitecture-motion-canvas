import {
  Code,
  PossibleCodeScope,
  Ray,
  Rect,
  Txt,
  Line,
  makeScene2D,
  Gradient,
} from "@motion-canvas/2d";
import { ShaderBackground } from "../components/background";
import {
  all,
  any,
  chain,
  createRefArray,
  createSignal,
  DEFAULT,
  easeInBack,
  easeInOutBack,
  easeOutBack,
  easeOutCubic,
  run,
  SignalValue,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { Glass } from "../components/GlassRect";
import { GlassBodyText, GlowPanelTitle } from "../components/TextPresets";
import { AsmHighlighter } from "../utils/AsmHighlighter";

export default makeScene2D(function* (view) {
  view.fill("rgba(8, 1, 2, 1)");
  view.add(<ShaderBackground opacity={0.25} preset="cyberWave" />);
  const register_signal = createSignal<number>(0);
  const stack_count = createSignal(0);
  const stackHeaderHeight = 200;

  const stackBaseSize = createSignal(() => ((stack_count() + 1) * 850) / 6);
  const stackHeight = () => Math.max(stackBaseSize(), stackHeaderHeight + 100);

  const registers: {
    name: SignalValue<string>;
    represents: SignalValue<string>;
  }[] = [
    {
      name: "R0",
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

  const stackEntries: {
    address: string;
    content: string;
    note: string;
    highlight?: boolean;
  }[] = [
    {
      address: "100",
      content: "[0x7FF4]",
      note: "CALL pushes resume point",
    },
    {
      address: "99",
      content: "Prev BP",
      note: "Restore caller frame",
    },
    {
      address: "928",
      content: "R0 (3)",
      note: "First argument",
      highlight: true,
    },
    {
      address: "97",
      content: "R1 (5)",
      note: "Second argument",
      highlight: true,
    },
    {
      address: "96",
      content: "Scratch",
      note: "Temp slot",
    },
  ];

  const code_rect = (
    <Glass clip size={[1700, 1100]} x={-900} y={-200}>
      <Code
        zIndex={2}
        fontSize={37}
        width={1700}
        x={() => -code_rect.childAs<Code>(0).fontSize() * 5}
        height={560}
        textAlign={"left"}
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

  const array_address = createRefArray<Glass>();
  const array_value = createRefArray<Glass>();
  const array_notes = createRefArray<Glass>();

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
          const I = createSignal(index);
          return [
            <Glass
              key={`${entry.address}-addr`}
              zIndex={2}
              lightness={0.1}
              translucency={0.9}
              size={[420, 120]}
              ref={array_address}
              x={-540}
              y={rowY}
              scale={() => Math.min(1, Math.min(I() - stack_count(), 0) * -1)}
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
              scale={() => Math.min(1, Math.min(I() - stack_count(), 0) * -1)}
              ref={array_value}
              key={`${entry.address}-value`}
              zIndex={2}
              lightness={0}
              translucency={0.85}
              size={[360, 120]}
              x={-40}
              y={rowY}
              fill={undefined}
            >
              <GlassBodyText
                ref={array_value}
                text={entry.content}
                fontSize={52}
                fontWeight={600}
                textAlign={"center"}
                fill={"#ffffff"}
                zIndex={2}
              />
            </Glass>,
            <Glass
              scale={() => Math.min(1, Math.min(I() - stack_count(), 0) * -1)}
              ref={array_notes}
              key={`${entry.address}-note`}
              zIndex={2}
              lightness={0.1}
              translucency={1}
              size={[520, 120]}
              x={520}
              y={rowY}
            >
              <GlassBodyText
                text={entry.note}
                fontSize={40}
                opacity={0.85}
                textAlign={"center"}
                fill={"#cce3ff"}
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
          <Glass
            width={270}
            height={100}
            removeShadow={0}
            zIndex={2}
            x={-100}
            fill={"#0002"}
            translucency={0.1}
          >
            <GlassBodyText text={"0000"} zIndex={1} fontFamily={"Fira Code"} />
          </Glass>
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
    <Glass width={1700} height={350} top={code_rect.bottom().addY(50)}>
      <GlassBodyText
        text={"CALL saves return + BP so RET restores the frame cleanly."}
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

  function* hideRegisters() {
    yield* register_signal(0, 1);
  }

  function* focusOnCode(
    new_code: PossibleCodeScope,
    context: string,
    fs = 100
  ) {
    const comp = code_rect.childAs<Code>(0);
    const cont = context_view.findFirst((is) => is instanceof Txt);
    yield* all(comp.code(new_code, 1), comp.fontSize(fs, 1));
    yield* all(cont.text(context, 1), context_view.scale(1.05, 1).back(1));
  }

  function* push_stack(
    command: string | RegExp,
    address: number,
    value: string,
    note: string
  ) {
    const code = code_rect.childAs<Code>(0);
    const range = code.findFirstRange(command);
    const bboxes = code.getSelectionBBox(range);

    const box = bboxes[0].expand([8, 16]);
    const start = box.position
      .add(code_rect.position())
      .add(code.position())
      .addX(100)
      .addY(50);

    array_address[stack_count()].childAs<Txt>(0).text(address.toString());
    array_value[stack_count()].childAs<Txt>(0).text(value);
    array_notes[stack_count()].childAs<Txt>(0).text(note);

    var end = array_address[stack_count()]
      .absolutePosition()
      .sub(view.position())
      .addY(-50);
    if (stack_count() < 1) end.addY(-50);
    end.x = Math.min(end.x, 300);

    const line = (
      <Line
        shadowBlur={50}
        shadowColor={"white"}
        points={[start, start.lerp(end, 0.5).addY(200), end]}
        lineWidth={9}
        end={0}
        lineDash={[40, 40]}
        stroke={
          new Gradient({
            fromX: -1200,
            toX: -100,
            stops: [
              { offset: 0, color: "#fff0" },
              { offset: 1, color: "#fff" },
            ],
          })
        }
        endOffset={230}
        startOffset={190}
        radius={400}
        endArrow
      />
    ) as Line;
    view.add(line);

    yield code.selection(code.findFirstRange(command), 0.4);
    yield line.end(1, 0.7, easeOutCubic);
    yield* stack_count(stack_count() + 1, 1);
    yield code.selection(DEFAULT, 0.7);
    yield* line.start(1, 0.7, easeOutCubic).do(() => line.remove());
  }

  function* pop_stack(registername: "R0" | "R1" | "R2" | "PC" | "BP" | "SP") {
    const code = code_rect.childAs<Code>(0);
    const end_txt = register_space.findFirst(
      (t) => t instanceof Txt && t.text() == registername
    );

    // array_address[stack_count()].childAs<Txt>(0).text(address.toString());
    // array_value[stack_count()].childAs<Txt>(0).text(value);
    // array_notes[stack_count()].childAs<Txt>(0).text(note);
    const end = end_txt.absolutePosition().sub(view.position());
    var start = array_value[stack_count()]
      .absolutePosition()
      .sub(view.position())
      .addY(-50);
    if (stack_count() < 1) end.addY(-50);
    const sc = stack_count();

    if (register_signal() > 0) {
      const line = (
        <Line
          points={[start, start.lerp(end, 0.5).addY(200), end]}
          lineWidth={9}
          end={0}
          lineDash={[40, 40]}
          stroke={
            new Gradient({
              toY: -400,
              fromY: 400,
              stops: [
                { offset: 0, color: "#fff0" },
                { offset: 1, color: "#fff" },
              ],
            })
          }
          endOffset={40}
          startOffset={0}
          radius={400}
          endArrow
          shadowBlur={50}
          shadowColor={"white"}
        />
      ) as Line;
      view.add(line);

      yield chain(
        all(
          line.end(1, 1, easeOutCubic),
          array_value[sc].scale(1.1,.4),
        ),
        (
          end_txt
            .parent()
            .findFirst(
              (txt) => txt instanceof Txt && txt.text()[0] != "R"
            ) as any
        ).text(array_value[sc].findFirst((t) => t instanceof Txt).text(), 0.5),
        all(
          array_value[sc].scale(1,.5),
          line.start(1, 0.7),
        ),
        run(function* () {
          line.remove();
        })
      );
    }

    yield code.selection(code.findFirstRange("POP " + registername), 0.4);
    yield* waitFor(1.5);
    yield code.selection(code.findFirstRange("POP " + registername), 0.4);
    yield* stack_count(stack_count() - 1, 1);
  }

  yield* waitUntil("begin");

  // some demo things

  yield* focusOnCode("PUSH R0", "We push R0 to use it for adding");
  yield* push_stack("PUSH R0", 100, "0101", "arg 1");
  yield* focusOnCode("PUSH R0\nPUSH R1", "We push R1 to use it for adding");
  yield* push_stack("PUSH R0", 99, "0101", "arg 1");
  yield* push_stack("PUSH R1", 98, "1101", "arg 2");
  yield* focusOnCode(
    "PUSH R0\nPUSH R1\nPOP R0",
    "We push R1 to use it for adding"
  );
  yield* showRegisters();
  yield* pop_stack("R0");

  yield* push_stack("PUSH R1", 97, "1101", "arg 2");
  yield* hideRegisters();

  yield* waitUntil("next");
});
