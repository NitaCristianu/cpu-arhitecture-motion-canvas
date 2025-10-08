import { Grid, Icon, makeScene2D, Node, Txt } from "@motion-canvas/2d";
import { ShaderBackground } from "../components/background";
import {
  createSignal,
  easeInOutBack,
  SignalValue,
  waitUntil,
} from "@motion-canvas/core";
import { Glass } from "../components/GlassRect";
import {
  GlassBodyText,
  GlassCaption,
  GlowPanelTitle,
} from "../components/TextPresets";

export default makeScene2D(function* (view) {
  view.fill("rgba(8, 1, 2, 1)");
  view.add(<ShaderBackground opacity={0.25} preset="cyberWave" />);
  const camera = <Node />;

  const register_signal = createSignal<number>(0);

  const registers: {
    name: SignalValue<string>;
    represents: SignalValue<string>;
  }[] = [
    {
      name: createSignal<string>("R0"),
      represents: "something cool",
    },
    {
      name: "R1",
      represents: "something cool",
    },
    {
      name: "R2",
      represents: "something cool",
    },
    {
      name: "PC",
      represents: "something cool",
    },
    {
      name: "BP",
      represents: "something cool",
    },
    {
      name: "SP",
      represents: "something cool",
    },
  ];

  const code_rect = (
    <Glass size={[1700, 1300]} x={-900} y={-100}></Glass>
  ) as Glass;

  const stack_view = (
    <Glass
      size={() => [1700, 1000 - 300 * register_signal()]}
      x={900}
      y={() => 400 * register_signal()}
    ></Glass>
  );
  const register_space = (
    <Glass
      size={() => [1000 + 700 * register_signal(), 700 * register_signal()]}
      x={900}
      y={() => -400 * register_signal()}
      clip
    >
      <GlowPanelTitle
        text={"Register contents meaning"} // modify title to be more precise
        opacity={0.7}
        fontWeight={500}
        y={-250}
        fontSize={90}
        zIndex={1}
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
            zIndex={1}
          ></GlassBodyText>
          <GlassBodyText
            text={register.represents}
            opacity={0.8}
            fontSize={50}
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
        text={"initial text context here,this is max size"}
        width={1500}
        left={[-850 + 50, 0]}
        zIndex={1}
      />
      {/* <Icon
        color={"#fff"}
        icon={"mdi:code-braces"}
        size={100}
        right={[750 - 25, 0]}
        zIndex={2}
      /> */}
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
