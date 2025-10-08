import {
  Code,
  PossibleCodeScope,
  Ray,
  Rect,
  Txt,
  Line,
  makeScene2D,
  Gradient,
  lines,
} from "@motion-canvas/2d";
import { ShaderBackground } from "../components/background";
import {
  all,
  any,
  chain,
  createRef,
  createRefArray,
  createSignal,
  DEFAULT,
  delay,
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
      represents: "Arg0",
    },
    {
      name: "R1",
      represents: "Arg1",
    },
    {
      name: "R2",
      represents: "---",
    },
    {
      name: "PC",
      represents: "instr. addr.",
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
      content: "0xff24",
      note: "We assume SP is here",
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
        x={() => -code_rect.childAs<Code>(0).fontSize() * 2}
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
        x={-650}
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
              size={[220, 120]}
              ref={array_address}
              x={-650}
              y={rowY}
              scale={() => Math.min(1, Math.min(I() - stack_count(), 0) * -1)}
            >
              <GlassBodyText
                text={entry.address}
                fontSize={52}
                fontFamily={"Fira Code"}
                fontWeight={400}
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
                text={entry.content}
                fontFamily={"Fira Code"}
                fontSize={52}
                fontWeight={300}
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

  const registers_texts = createRefArray<Txt>();
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
            <GlassBodyText
              ref={registers_texts}
              text={
                i == 4
                  ? "1234"
                  : i == 5
                  ? "0096"
                  : i == 0
                  ? "0101"
                  : i == 1
                  ? "0011"
                  : i == 3
                  ? "MOV"
                  : "0000"
              }
              zIndex={1}
              fontFamily={"Fira Code"}
            />
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

  const bp_pos = createSignal(0);
  const sp_pos = createSignal(0);

  const BP = createRef<Glass>();
  const SP = createRef<Glass>();

  view.add(
    <Glass
      size={[120, 100]}
      fill={"#2531cf40"}
      translucency={0.5}
      ref={BP}
      scale={0}
      y={() =>
        array_address[0].absolutePosition().sub(view.position()).y +
        140 * bp_pos()
      }
      x={450}
      shadowColor={"rgba(122, 228, 254, 0.51)"}
      shadowBlur={30}
    >
      <GlowPanelTitle
        fontSize={60}
        shadowColor={"#2235e32a"}
        zIndex={1}
        fill={"#e7f8ffdd"}
        text={"BP"}
      />
    </Glass>
  );

  view.add(
    <Glass
      size={[120, 100]}
      fill={"#cf4d2540"}
      translucency={0.2}
      ref={SP}
      scale={0}
      shadowBlur={30}
      shadowColor={"rgba(247, 165, 133, .5)"}
      y={() =>
        array_address[0].absolutePosition().sub(view.position()).y +
        140 * sp_pos()
      }
      x={590}
    >
      <GlowPanelTitle
        fontSize={60}
        shadowColor={"#ec64202a"}
        zIndex={1}
        fill={"#fff0e7dd"}
        text={"SP"}
      />
    </Glass>
  );

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

    const sc = stack_count();
    array_address[sc].childAs<Txt>(0).text(address.toString());
    array_value[sc].childAs<Txt>(0).text(value);
    array_notes[sc].childAs<Txt>(0).text(note);

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
    yield sp_pos(sp_pos() + 1, 1);
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
    const sc = stack_count();

    var start = array_value[sc - 1]
      .absolutePosition()
      .sub(view.position())
      .addY(-50);
    if (stack_count() < 1) end.addY(-50);

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
        all(line.end(1, 1, easeOutCubic), array_value[sc - 1].scale(1.1, 0.4)),
        (
          end_txt
            .parent()
            .findFirst(
              (txt) => txt instanceof Txt && txt.text().length > 2
            ) as any
        ).text(
          array_value[sc - 1].findFirst((t) => t instanceof Txt).text(),
          0.5
        ),
        all(array_value[sc - 1].scale(0, 0.5), line.start(1, 0.7)),
        run(function* () {
          line.remove();
        })
      );
    }

    yield code.selection(code.findFirstRange("POP " + registername), 0.4);
    yield sp_pos(sp_pos()-1, 1);
    yield* waitFor(1.5);
    yield code.selection(code.findFirstRange("POP " + registername), 0.4);
    yield* stack_count(stack_count() - 1, 1);
  }

  function* changeRegister(i: number, val: string) {
    yield* all(
      registers_texts[i].parent().scale(1.1, 0.5).back(0.5),
      registers_texts[i].text(val, 0.6)
    );
  }

  function* movRegister(i: number, j: number) {
    const ti = registers_texts[i];
    const tj = registers_texts[j];
    const value = ti.text();
    const line = (
      <Ray
        stroke={"#ff0"}
        shadowBlur={50}
        shadowColor={"#ff0"}
        end={0}
        lineWidth={10}
        from={ti.absolutePosition().sub(view.position())}
        to={tj.absolutePosition().sub(view.position())}
        endArrow
        startOffset={150}
        lineDash={[20, 20]}
        endOffset={150}
      />
    ) as Ray;
    view.add(line);

    yield* line.end(1, 0.6, easeOutCubic);
    yield changeRegister(j, value);
    yield* line.start(1, 0.6);
  }

  yield* waitUntil("begin");

  // some demo things
  // yield* focusOnCode("PUSH R0", "We push R0 to use it for adding");
  // yield* push_stack("PUSH R0", 100, "0101", "arg 1");
  // yield* focusOnCode("PUSH R0\nPUSH R1", "We push R1 to use it for adding");
  // yield* push_stack("PUSH R0", 99, "0101", "arg 1");
  // yield* push_stack("PUSH R1", 98, "1101", "arg 2");
  // yield* focusOnCode(
  //   "PUSH R0\nPUSH R1\nPOP R0",
  //   "We push R1 to use it for adding"
  // );
  // yield* showRegisters();
  // yield* pop_stack("R0");

  // yield* push_stack("PUSH R1", 97, "1101", "arg 2");
  // yield* hideRegisters();

  // set sp to 100
  yield* all(stack_count(1, 1));
  yield* SP().scale(1, 0.5, easeOutBack);

  yield* waitUntil("1-2");

  yield* focusOnCode(
    `\
PUSH R0        ; arg1
PUSH R1        ; arg2
CALL ADD_FN`,
    "Let's set the arguments: \nwe push R0 and R1 on the stack\nthen we call the function"
  );
  yield* push_stack("PUSH R0", 99, "0101", "this is register 0 ( = 5 )");
  yield* push_stack("PUSH R1", 98, "0011", "this is register 1 ( = 3 )");
  yield* push_stack(
    "CALL ADD_FN",
    97,
    "0xff0",
    "this will be the return address"
  );

  yield* waitUntil("3-4");
  yield* focusOnCode(
    `\
ADD_FN:
  PUSH BP
  MOV  BP, SP`,
    `This is the prologue of the function.\nWe save BP so later we can return to it.
    `
  );

  yield* push_stack("PUSH BP", 96, "0xff2", "old BP");
  yield* waitFor(1);

  yield* showRegisters();

  yield* code_rect.childAs<Code>(0).selection(lines(2), 0.5);
  yield delay(0.5, all(bp_pos(4, 0), BP().scale(1, 1, easeOutBack)));
  yield* movRegister(5, 4);
  yield* code_rect.childAs<Code>(0).selection(DEFAULT, 0.5);

  yield* waitUntil("4-sense");
  yield* context_view
    .childAs<Txt>(0)
    .text(
      "[BP+0] = saved BP , [BP+1] = return address\n[BP+2] = arg2 , [BP+3] = arg1",
      1
    );
  yield* waitFor(3);
  yield* context_view
    .childAs<Txt>(0)
    .text("BP will stay fixed, SP will move.", 1);

  yield* waitUntil("5-6");
  yield hideRegisters();
  yield* focusOnCode(
    `\
MOV  R3, [BP + 3]   ; R3 = arg1
MOV  R4, [BP + 2]   ; R4 = arg2
ADD  R3, R4 ; simple R3 += R4
MOV  [BP + 2], R3`,
    "We load into register and\nperform a simple addition. We save the result in [BP+2]",
    75
  );
  yield* waitUntil("store");
  yield* all(
    array_value[2].childAs<Txt>(0).text("RESULT", 1),
    array_notes[2].childAs<Txt>(0).text("this will be the return value", 1),
    array_value[2].scale(1.1, 0.7).back(0.7),
    array_notes[2].scale(1.1, 0.7).back(0.7)
  );
  yield* waitUntil("7-8");
  // epilogue
  yield* focusOnCode(
    `\
MOV  SP, BP
POP  BP
RET`,
    "We start the epilogue.\nWe return right before we called the function.",
    120
  );
  yield* showRegisters();
  yield* code_rect.childAs<Code>(0).selection(lines(0), 0.5);
  yield* movRegister(4, 5);
  yield* waitFor(1);
  yield registers_texts[3].text("POP", 1);
  yield delay(1.5, all(bp_pos(4, 0), BP().scale(0, .5, easeInBack)));
  yield* pop_stack("BP");
  yield* code_rect.childAs<Code>(0).selection(DEFAULT, 0.5);
  yield* waitFor(1);
  yield* registers_texts[3].text("RET", 1);
  yield* pop_stack("PC");
  yield* code_rect.childAs<Code>(0).selection(DEFAULT, 0.5);
  yield* focusOnCode(
    `\
PUSH R0
PUSH R1
CALL ADD_FN
POP R2 ; read result
HLT`,
    "We can finally retrieve the result\nfrom the stack and move on.",
    100
  );
  yield* waitFor(1);
  yield delay(1.4, array_notes[2].scale(0, 1));
  yield registers_texts[3].text("POP", 1);
  yield* pop_stack("R2");
  yield* code_rect.childAs<Code>(0).selection(DEFAULT, 0.5);

  yield* waitUntil("back");
  yield* focusOnCode(
    `\
; --- Main Program ---
PUSH R0          ; arg1 (e.g., 3)
PUSH R1          ; arg2 (e.g., 5)
CALL ADD_FN      ; expects 2 args on stack
POP  R2          ; result -> R2
HLT

; --- Function: ADD_FN ---
ADD_FN:
  PUSH BP        ; prologue
  MOV  BP, SP

  ; Stack layout now (top = BP):
  ; [BP+0] = saved BP
  ; [BP+1] = return address
  ; [BP+2] = arg2  (second PUSH)
  ; [BP+3] = arg1  (first PUSH)

  MOV  R3, [BP + 3]   ; R3 = arg1
  MOV  R4, [BP + 2]   ; R4 = arg2
  ADD  R3, R4         ; R3 = arg1 + arg2

  MOV  [BP + 2], R3   ; overwrite arg2 slot with result (caller POP gets it)

  MOV  SP, BP         ; epilogue
  POP  BP
  RET`,
    "These are the basics of handling stacks in CPUs :)",
    33
  );

  yield* waitUntil("next");
});
