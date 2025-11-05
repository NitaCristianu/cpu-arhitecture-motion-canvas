import { Code, Layout, makeScene2D } from "@motion-canvas/2d";
import {
  all,
  chain,
  createRef,
  createRefArray,
  easeOutBack,
  easeOutCubic,
  easeOutSine,
  Reference,
  ReferenceArray,
  useRandom,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { ShaderBackground } from "../components/background";
import { PythonHighlighter } from "../utils/PythonHighlighter";

function addCode(
  code: string,
  container: Reference<Layout>,
  ref: ReferenceArray<Code>
) {
  container().add(
    <Code
      highlighter={new PythonHighlighter()}
      fontSize={120}
      fontFamily={"Fira Code"}
      code={code}
      ref={ref}
    />
  );
}

export default makeScene2D(function* (view) {
  view.fill("black");
  const background = createRef<ShaderBackground>();
  view.add(
    <ShaderBackground preset="ramDark" ref={background} opacity={0.5} />
  );

  yield* waitUntil("show code");

  const fragments = createRefArray<Code>();
  const container = createRef<Layout>();

  view.add(<Layout layout ref={container} wrap={"wrap"} width={1500} />);

  addCode("a = doSomeLogic()", container, fragments);
  addCode("             ", container, fragments);
  addCode("if a > 5:      ", container, fragments);
  addCode("   a += 1", container, fragments);
  addCode("                ", container, fragments);
  addCode("print", container, fragments);
  addCode('("Hello World")', container, fragments);

  const generator = useRandom(0);

  const clones_container = createRef<Layout>();
  view.add(<Layout ref={clones_container} scale={0.5} />);
  const clones = fragments.map((fragment) => {
    const c = fragment.clone();
    c.absolutePosition(fragment.absolutePosition().sub(view.position()));
    c.save();

    fragment.opacity(0);

    c.position.mul(
      generator
        .floatArray(2, 3, 4)
        .map((n) => n * (generator.nextInt(0, 2) == 1 ? 1 : -1)) as [
        number,
        number
      ]
    );
    c.scale(0);
    c.opacity(0);

    clones_container().add(c);

    return c;
  });

  yield* all(
    ...clones.map((c) => c.restore(2.5, easeOutBack)),
    clones_container().scale(1, 3, easeOutSine)
  );

  yield* waitUntil("never look at coding");
  const lines: Code[][] = [
    [clones[0]],
    [clones[2]],
    [clones[3]],
    [clones[5], clones[6]],
  ];
  function* swap(i = 0, j = 1) {
    const l0 = lines[i][0].y();
    const l1 = lines[j][0].y();

    yield* all(
      all(...lines[i].map((c) => c.y(l1, 1))),
      all(...lines[j].map((c) => c.y(l0, 1)))
    );
  }
  function* removeCode(i = 0, nextline = "a += 1") {
    const line = lines[i];
    const next = lines[i + 1];

    yield* all(
      next[0].code(nextline, 1),
      next[0].y(line[0].y(), 1),
      line[0].code("", 1),
      next[0].x(-530, 1)
    );
  }
  yield*  chain(swap(0, 3), removeCode(1), swap(2,0));

  yield* waitUntil("next");
});
