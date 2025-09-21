import { makeScene2D, Txt } from "@motion-canvas/2d";
import {
  all,
  chain,
  createRefArray,
  easeOutCirc,
  easeOutCubic,
  PossibleVector2,
  range,
  run,
  sequence,
  useRandom,
  Vector2,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { ShaderBackground } from "../components/background";
import { Bitnumber } from "../utils/bitnumber";

export default makeScene2D(function* (view) {
  view.fill("#010a1b");
  const bgr = <ShaderBackground opacity={0.4} />;
  view.add(bgr);
  yield* waitUntil("begin");

  const generator = useRandom(0);

  const opcode = (<Bitnumber bits={4} y={50} x={-700} />) as Bitnumber;
  const operand = (<Bitnumber bits={4} y={50} x={700} />) as Bitnumber;
  view.add(opcode);
  view.add(operand);

  yield* sequence(0.4, opcode.pop(), operand.pop());
  yield* sequence(0.4, opcode.scale(2, 1), operand.scale(2, 1));

  const diplay = function* (
    element: Bitnumber | Bitnumber[],
    tag: "opcode" | "operand" | string
  ) {
    const bigroups = element instanceof Bitnumber ? [element] : element;

    const average_pos = bigroups
      .reduce((acc, val) => acc.add(val.position()), Vector2.zero)
      .div(bigroups.length || 1); // guard against empty

    const title = (
      <Txt
        fill={"white"}
        shadowBlur={30}
        shadowColor={"#000a"}
        position={average_pos}
        opacity={0}
        scaleY={0}
        fontSize={120}
      />
    ) as Txt;
    title.save();
    view.add(title);
    bigroups.forEach((el) => el.shadowColor("#fffa"));

    yield chain(
      all(
        title.text(tag, 0.6, easeOutCubic),
        title.opacity(1, 0.6, easeOutCubic),
        title.scale(1, 0.6, easeOutCubic),
        title.position(
          title.position().addY(-250).addX(100),
          0.6,
          easeOutCubic
        ),
        ...bigroups.map((element) =>
          all(
            element.shadowBlur(100, 1),
            element.y(element.y() + 50, 1),
            run(function* () {
              element.load(generator.nextInt(5, 16));
            })
          )
        ),
        waitFor(0.5),
        all(
          title.restore(0.6),
          title.text("", 0.6),
          ...bigroups.map((element) =>
            all(element.shadowBlur(0, 1), element.y(element.y() - 50, 1))
          )
        )
      )
    );
  };

  yield* waitUntil("opcode");
  yield* diplay(opcode, "opcode");
  yield* waitUntil("operand");
  yield* diplay(operand, "operand");
  yield* waitFor(2.5);

  yield* waitUntil("expand");
  const bitgroups = createRefArray<Bitnumber>();
  bitgroups.push(opcode);
  bitgroups.push(operand);

  // add
  const remaining = [4, 10, 10];
  range(remaining.length).map((i) => {
    const bitg = (
      <Bitnumber initialVisibility scaleX={0} bits={remaining[i]} />
    ) as Bitnumber;
    bitgroups.push(bitg);
    view.add(bitg);
    return bitg;
  });
  operand.load(0);
  opcode.load(0);

  const positions = [
    [-1150, -600], // operand (first 4)
    [-50, -600], // operand (next 4)
    [1150, -600], // modifier,
    [0, 0], // opcode 1
    [0, 600], // opcode 2
  ] as PossibleVector2[];
  yield* all(
    sequence(
      0.1,
      ...bitgroups.map((bitgroup, i) =>
        all(bitgroup.position(positions[i], 1), bitgroup.scale(1.6, 1))
      )
    )
  );

  yield* waitUntil("next");
});
