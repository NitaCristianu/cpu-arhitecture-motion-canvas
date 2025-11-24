import {
  Grid,
  Icon,
  Img,
  Layout,
  makeScene2D,
  Node,
  Ray,
  Rect,
  Txt,
  wrapper,
} from "@motion-canvas/2d";
import {
  all,
  chain,
  createRef,
  createRefArray,
  delay,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  linear,
  loop,
  range,
  sequence,
  spawn,
  useLogger,
  useRandom,
  Vector2,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { createScene } from "../components/presets";

import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

import SN74181 from "../assets/74181.png";
import SN74181Circuit from "../assets/SN74181-Circuit.png";
import SN74181Table from "../assets/SN74181-Table.jpg";

import * as THREE from "three";
import Scene3D from "../libs/Thrash/Scene";
import Mesh from "../libs/Thrash/objects/Mesh";
import Box from "../libs/Thrash/objects/Box";
import { ShaderBackground } from "../components/background";
import Model from "../libs/Thrash/objects/Model";
import Sphere from "../libs/Thrash/objects/Sphere";
import { Bitnumber } from "../utils/bitnumber";
import { GlassBodyText, GlowPanelTitle } from "../components/TextPresets";
import { Label3D } from "../components/Label3D";
import { Glass } from "../components/GlassRect";

export default makeScene2D(function* (view) {
  const generator = useRandom();
  const scene = createScene(new THREE.Vector3(3, 3, 0));
  const camera = scene.getCameraClass();

  const sn74181 = createRef<Img>();
  const sn74181Circuit = createRef<Img>();
  const sn74181Container = createRef<Rect>();
  const sn74181Info = createRef<Rect>();

  const sn74181Model = createRef<Model>();
  const peel181 = createRef<Model>();

  scene.add(
    <Model
      ref={sn74181Model}
      localScale={new THREE.Vector3(1, 0.3, 2).multiplyScalar(0.5)}
      localPosition={new THREE.Vector3(2, 0, 0)}
      src={"/models/Chips/sn74181.glb"}
    />
  );

  scene.add(
    <Model
      ref={peel181}
      localScale={new THREE.Vector3(0.18, 0.02 * 4, 0.13).multiplyScalar(6)}
      localPosition={new THREE.Vector3(2, 0, 0)}
      src={"/models/Chips/ALU.glb"}
    />
  );

  const points_origin = new THREE.Vector3(0.19, -0.03, 0.035);
  const points = range(12).map((i) =>
    points_origin.clone().add(new THREE.Vector3(0, 0, (i - 6) * 0.08))
  );
  const points_offseted = points.map((p, i) =>
    p.clone().add(new THREE.Vector3(1.5, i % 2 == 0 ? 0.1 : -0.1, 0))
  );

  const spheres = createRefArray<Sphere>();
  scene.add(
    points.map((p, i) => (
      <Sphere
        ref={spheres}
        localScale={new THREE.Vector3(0, 0, 0).multiplyScalar(0.02)}
        localPosition={p}
        material={
          new THREE.MeshBasicMaterial({
            color: i > 3 ? (i > 7 ? "#b946c9" : "#0090c9") : "#fc3636",
          })
        }
      />
    ))
  );

  scene.init();
  view.add(scene);

  view.add(
    <Rect layout scale={0} ref={sn74181Container}>
      <Layout
        layout
        justifyContent={"center"}
        direction={"column"}
        gap={50}
        width={1000}
        scaleX={0}
        margin={30}
        ref={sn74181Info}
      >
        <Txt
          text={"SN74181"}
          fill={"d0d0d0"}
          fontFamily={"Poppins"}
          y={-600}
          width={400}
          fontSize={120}
        />
        <Rect
          fontFamily={"Poppins"}
          y={530}
          textWrap
          direction={"column"}
          gap={80}
        >
          <Txt fill={"d0d0d0"}>
            The first ALU chip, built by Texas Instruments in 1970.{" "}
          </Txt>
          <Txt fill={"d0d0d0"}>
            It performed arithmetic and logic operations.
          </Txt>
          <Txt fill={"d0d0d0"}>
            It powered many early computers like Xerox Alto which is considered
            one of the first workstations or personal computers, and its
            development pioneered many aspects of modern computing. It features
            a graphical user interface. (GUI)
          </Txt>
          <Txt fill={"#d0d0d0"}>
            It was designed when CPU microarchitecture wasn’t standardized.
          </Txt>

          <Txt fill={"d0d0d0"}>Photo courtesy of logicroom.jp.</Txt>
        </Rect>
      </Layout>
      <Rect fill={"#48516eff"} radius={32} clip>
        <Grid
          zIndex={1}
          spacing={200}
          stroke={"#fff5"}
          lineWidth={3}
          size={"100%"}
          layout={false}
        />
        <ShaderBackground
          offset={-0.4}
          zIndex={0}
          opacity={0.4}
          compositeOperation={"darken"}
          preset="goldenHour"
          layout={false}
        />
        <Rect
          fill={"white"}
          size={"100%"}
          zIndex={1}
          layout={false}
          opacity={() => sn74181Circuit().opacity()}
        ></Rect>
        <Img
          ref={sn74181Circuit}
          height={1200 - 50}
          scale={0.3}
          opacity={0}
          zIndex={1}
          layout={false}
          src={SN74181Circuit}
        ></Img>
        <Img zIndex={2} src={SN74181} ref={sn74181} height={1200} />
      </Rect>
    </Rect>
  );
  yield* waitUntil("start");

  yield sequence(
    0.2,
    sn74181Container().scale(1, 0.8, easeOutBack),
    sn74181().scale(1.2, 0.8).back(0.8),
    sn74181Info().scale(1, 0.8, easeOutBack)
  );

  yield* waitUntil("the first");
  yield* all(
    sn74181Container().scale(2, 1),
    sn74181Container().position([1400, 400], 1),
    (
      sn74181Container().findFirst(
        (n) => n instanceof Txt && n.text().includes("1970")
      ) as Txt
    ).fill("#ff6464ff", 1)
  );
  yield* waitUntil("single chip");
  yield* all(
    sn74181Container().position([1400, -500], 1),
    (
      sn74181Container().findFirst(
        (n) => n instanceof Txt && n.text().includes("microarchitecture")
      ) as Txt
    ).fill("#ff6464ff", 1)
  );
  yield* waitUntil("internaly");
  yield* all(
    sn74181Container().scale(1.4, 1),
    sn74181Container().position([-700, 0], 1),
    delay(
      0.5,
      all(
        sn74181Circuit().scale(1, 0.6, easeOutBack),
        sn74181Circuit().opacity(1, 0.6),
        sn74181().opacity(0, 0.6)
      )
    )
  );
  //   yield* sn74181.popIn();

  const table = createRef<Img>();
  view.add(
    <Img
      opacity={0.9}
      radius={64}
      ref={table}
      y={3000}
      height={1600}
      src={SN74181Table}
    />
  );

  yield* waitUntil("table");
  yield* all(
    sn74181Container()
      .y(-3000, 1.5, easeInCubic)
      .do(() => sn74181Container().remove()),
    table().y(0, 2, easeOutCubic)
  );
  yield* sequence(
    0.6,
    all(table().scale(0.8, 1), table().x(800, 1)),
    sn74181Model().moveLeft(2, 1),
    all(
      camera.moveForward(2, 1),
      camera.lookTo(
        camera.lookAt().clone().add(new THREE.Vector3(0, 0.15, -0.85)),
        1,
        easeInOutCubic
      )
    )
  );

  yield* waitUntil("4bit");
  const fourbit_numbers = createRefArray<Bitnumber>();
  view.add(
    range(3).map((i) => (
      <Bitnumber
        number={generator.nextInt(0, 16)}
        ref={fourbit_numbers}
        bitgroups={1}
        position={
          [
            new Vector2(-909, 32),
            new Vector2(-248, 283),
            new Vector2(407, 588),
          ][i]
        }
      />
    ))
  );
  view.add(
    fourbit_numbers.map((bitn, i) => (
      <GlowPanelTitle
        text={["A", "B", "OUT"][i]}
        bottom={() => bitn.top().addY(-20).addX(60)}
        scale={() => bitn.childAs<Rect>(2).scale()}
        fill={(spheres[(2 - i) * 4].material() as THREE.MeshBasicMaterial).color
          .clone()
          .lerp(new THREE.Color("#fff"), 0.5)
          .getHexString()}
        shadowColor={(
          spheres[(2 - i) * 4].material() as THREE.MeshBasicMaterial
        ).color
          .clone()
          .lerp(new THREE.Color("#fff"), 0.5)
          .getHexString()}
      />
    ))
  );
  yield all(
    camera.lookTo(sn74181Model().localPosition()),
    camera.zoomTo(2, 1),
    table().x(2500, 1),
    table().opacity(0.4, 1)
  );
  yield* all(
    ...spheres.map((sphere) =>
      sphere.glowTo(
        (sphere.material() as THREE.MeshBasicMaterial).color
          .clone()
          .lerp(new THREE.Color("#fff"), 0.4),
        0
      )
    )
  );
  yield* waitFor(0.5);
  yield* sequence(
    0.2,
    sequence(
      0.05,
      ...spheres
        .slice(0, 4)
        .map((sp) =>
          sp.popIn(0.6, new THREE.Vector3(1, 1, 1).multiplyScalar(0.02))
        ),
      fourbit_numbers[0].pop(),
      fourbit_numbers[0].y(fourbit_numbers[0].y() - 380, 0.5),
      ...fourbit_numbers[0]
        .children()
        .map((c) =>
          c instanceof Rect
            ? c.fill(
                (spheres[11].material() as THREE.MeshBasicMaterial).color
                  .clone()
                  .getHexString() + "33",
                1
              )
            : null
        )
    ),
    sequence(
      0.05,
      ...spheres
        .slice(4, 8)
        .map((sp) =>
          sp.popIn(0.6, new THREE.Vector3(1, 1, 1).multiplyScalar(0.02))
        ),
      fourbit_numbers[1].y(fourbit_numbers[1].y() - 380, 0.5),
      fourbit_numbers[1].pop(),
      ...fourbit_numbers[1]
        .children()
        .map((c) =>
          c instanceof Rect
            ? c.fill(
                (spheres[7].material() as THREE.MeshBasicMaterial).color
                  .clone()
                  .getHexString() + "33",
                1
              )
            : null
        )
    ),
    sequence(
      0.05,
      ...spheres
        .slice(8, 12)
        .map((sp) =>
          sp.popIn(0.6, new THREE.Vector3(1, 1, 1).multiplyScalar(0.02))
        ),
      fourbit_numbers[2].y(fourbit_numbers[2].y() - 380, 0.5),
      fourbit_numbers[2].pop(),
      ...fourbit_numbers[2]
        .children()
        .map((c) =>
          c instanceof Rect
            ? c.fill(
                (spheres[2].material() as THREE.MeshBasicMaterial).color
                  .clone()
                  .getHexString() + "33",
                1
              )
            : null
        )
    )
  );

  yield* waitUntil("functions");
  yield* sequence(
    0.2,
    ...fourbit_numbers.map((b) => b.pop()),
    table().position(0, 1),
    table().opacity(0.9, 1),
    table().scale(1, 1)
  );
  yield* waitUntil("operations");
  yield* chain(all(table().scale(2, 1), table().y(1000, 1)));
  yield* waitUntil("addition");
  yield* table().y(-1000, 1, easeInOutCubic);
  yield* waitUntil("subtraction");
  yield* table().y(-300, 1, easeInOutCubic);
  yield* waitUntil("exit");
  yield* all(table().scale(1, 1), table().y(0, 1));
  yield* waitUntil("restore");
  yield* table().scale(0, 1);
  yield* camera.zoomOut(0.8, 3);
  yield* waitUntil("bananalogic");

  const label = createRef<Label3D>();
  view.add(
    <Label3D
      scene={scene}
      worldPosition={peel181()
        .localPosition()
        .clone()
        .add(new THREE.Vector3(0, 1, 0))}
      text={"Peel 181"}
      fontSize={120}
      fontFamily={"Fira Code"}
      ref={label}
      color="io"
    />
  );

  yield* label().popIn();
  yield* all(
    camera.moveRight(8, 1),
    camera.lookAt(peel181().localPosition(), 1)
  );
  yield* waitFor(0.5);
  yield* all(
    camera.moveTo(
      peel181().localPosition().clone().add(new THREE.Vector3(2, 5, 0)),
      1
    ),
    label().offset2D([0, -820], 1)
  );

  yield* waitUntil("data");
  yield* all(camera.moveForward(0.5, 1), camera.lookForward(0.5, 1));

  const META = [
    { label: "Year: 1970½", icon: "mdi:calendar-clock" }, // absurd on purpose
    { label: "Family: Peel", icon: "mdi:resistor" },
    { label: "Bus: 8-bit", icon: "mdi:numeric-8-box" },
    { label: "Made by BananaLogic", icon: "mdi:arrow-right-bold" },
  ];

  const SPECS = [
    { t: "8-bit data path", icon: "mdi:numeric-8-box" },
    { t: "Multiply", icon: "mdi:multiplication" },
    { t: "Add", icon: "mdi:plus" },
    { t: "Subtract", icon: "mdi:minus" },
    { t: "12 total ops", icon: "mdi:function-variant" },
  ];

  const banalogic = createRef<Rect>();
  const icon = createRef<Icon>();
  const metas = createRefArray<Rect>();
  const rows = createRefArray<Rect>();
  const opsBadge = createRef<Rect>();

  view.add(
    <Rect
      ref={banalogic}
      layout
      direction={"column"}
      gap={40}
      position={[1000, 0]}
      width={1200}
      padding={48}
      radius={36}
      fill={"#ffffff10"}
      stroke={"#ffffff25"}
      lineWidth={2}
      shadowBlur={60}
      shadowColor={"#000000aa"}
      opacity={0}
      scale={0.9}
    >
      {/* Header */}
      <Rect layout direction={"row"} gap={24} alignItems={"center"}>
        <Icon
          ref={icon}
          icon={"twemoji:banana"}
          width={86}
          color={"#fff"}
          opacity={0}
          scale={0.8}
        />
        <Txt
          fontFamily={"Poppins"}
          fontSize={72}
          fill={"#fff"}
          shadowBlur={30}
          shadowColor={"#fff5"}
        >
          Peel-181
        </Txt>
        <Rect
          ref={opsBadge}
          radius={999}
          padding={[10, 18]}
          fill={"#ffffff1a"}
          opacity={0}
          scale={0.8}
        >
          <Txt fontFamily={"Poppins"} fontSize={36} fill={"#fffd"}>
            12 ops
          </Txt>
        </Rect>
      </Rect>

      {/* Providers */}
      <Rect layout direction={"row"} gap={16}>
        {META.map((p) => (
          <Rect
            key={p.label}
            ref={metas}
            layout
            direction={"row"}
            gap={10}
            padding={[10, 16]}
            radius={999}
            fill={"#ffffff14"}
            stroke={"#ffffff22"}
            lineWidth={1}
            opacity={0}
            scale={0.9}
            alignItems={"center"}
          >
            <Icon icon={p.icon} width={28} color={"#fffd"} />
            <Txt fontFamily={"Poppins"} fontSize={26} fill={"#fffd"}>
              {p.label}
            </Txt>
          </Rect>
        ))}
      </Rect>

      {/* Specs */}
      <Rect layout direction={"column"} gap={18}>
        {SPECS.map((s) => (
          <Rect
            key={s.t}
            ref={rows}
            layout
            direction={"row"}
            gap={16}
            opacity={0}
            y={8}
            alignItems={"center"}
          >
            <Icon icon={s.icon} width={70} color={"#fffd"} />
            <Txt
              fontFamily={"Poppins"}
              fontSize={36}
              fill={"#fffd"}
              shadowBlur={12}
              shadowColor={"#fff3"}
            >
              {s.t}
            </Txt>
          </Rect>
        ))}
      </Rect>
    </Rect>
  );

  yield* chain(
    all(banalogic().opacity(1, 0.5), banalogic().scale(1.5, 0.6, easeOutBack)),
    all(icon().opacity(1, 0.3), icon().scale(1, 0.3, easeOutBack)),
    all(opsBadge().opacity(1, 0.25), opsBadge().scale(1, 0.25, easeOutBack)),
    sequence(
      0.08,
      ...metas.map((p) =>
        all(p.opacity(1, 0.25), p.scale(1, 0.25, easeOutBack))
      )
    ),
    sequence(
      0.06,
      ...rows.map((r) => all(r.opacity(1, 0.25), r.y(0, 0.25, easeOutBack)))
    ),
    waitFor(0.1)
  );
  // yield alu.rotateTo(new Vector3(0, Math.PI*10, 0), 20);

  yield* waitUntil("8bit");
  yield* all(
    ...metas.map((m, i) =>
      i != 2 ? m.opacity(0.4, 0.4, easeOutCubic) : m.scale(1.1, 0.5).back(0.5)
    )
  );
  yield* waitUntil("mul");
  yield* all(
    ...rows.map((r, i) =>
      i != 1 ? r.opacity(0.4, 0.4, easeOutCubic) : r.scale(1.1, 0.5).back(0.5)
    )
  );

  yield* waitUntil("show title");
  const loader = new FontLoader();
  loader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    (font) => {
      const geometry = new TextGeometry("Binary interpretation", {
        font: font,
        size: 0.5,
        depth: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5,
      });

      const material = new THREE.MeshStandardMaterial({ color: "#cccccc " });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.copy(
        peel181().localPosition().clone().add(new THREE.Vector3(4, 0, 2.6))
      );
      mesh.scale.multiplyScalar(1);
      mesh.rotateY(Math.PI / 2);
      mesh.rotateX(-Math.PI / 2);

      scene.scene.add(mesh);
    }
  );
  yield* all(
    camera.lookRight(4, 2),
    camera.moveTo(
      camera.localPosition().clone().add(new THREE.Vector3(2.1, 5, 0)),
      1
    ),
    banalogic().y(-1800, 1.2),
    camera.zoomOut(0.6, 2)
  );
  yield* waitUntil("transition");
  const title = createRef<Txt>();
  const Backgorund = createRef<ShaderBackground>();

  view.fill("rgba(14, 28, 83, 1)");
  view.add(<ShaderBackground ref={Backgorund} opacity={0} />);
  view.add(
    <GlowPanelTitle
      fontSize={350}
      y={-150}
      x={50}
      ref={title}
      text={"Binary interpretation "}
    ></GlowPanelTitle>
  );
  yield* all(
    Backgorund().opacity(0.5, 1),
    scene.opacity(0, 1).do(() => scene.remove())
  );

  const container = createRef<Node>();
  view.add(<Node ref={container} />);
  const line = createRef<Ray>();
  container().add(
    <Ray
      ref={line}
      fromY={-4200}
      toY={4200}
      shadowBlur={60}
      shadowColor={"#fffa"}
      stroke={"white"}
      lineWidth={10}
      position={title().position()}
      end={0}
    ></Ray>
  );
  const numbers_decimal = (
    <Layout
      justifyContent={"center"}
      direction={"column"}
      alignItems={"center"}
      width={400}
      position={line().position().addX(-500).addY(24100)}
      gap={50}
      layout
    >
      {...range(256).map((i) => (
        <Txt
          scale={i <= 7 ? 0.3 : 1}
          opacity={i > 7 ? 1 : 0}
          fontSize={120}
          fill={"#e9ff44"}
          shadowBlur={20}
          shadowColor={"#ff05"}
        >
          {i.toString()}
        </Txt>
      ))}
    </Layout>
  );
  container().add(numbers_decimal);
  const numbers_binary = (
    <Layout
      justifyContent={"center"}
      alignItems={"center"}
      width={400}
      direction={"column"}
      position={line().position().addX(500).addY(24100)}
      gap={50}
      layout
    >
      {...range(256).map((i) => (
        <Txt
          scale={i <= 7 ? 0.3 : 1}
          opacity={i > 7 ? 1 : 0}
          fontSize={120}
          fill={"white"}
          shadowBlur={20}
          shadowColor={"#fff5"}
        >
          {i.toString(2)}
        </Txt>
      ))}
    </Layout>
  );
  container().add(numbers_binary);
  yield all(
    title().y(title().y() - 4000, 1, easeInCubic),
    title().opacity(0, 1, easeInCubic),
    line().end(1, 1)
  );
  yield sequence(
    0.1,
    ...numbers_decimal
      .children()
      .slice(0, 8)
      .map((c) =>
        all(c.opacity(1, 0.7, easeOutCubic), c.scale(1, 0.7, easeOutBack))
      )
  );
  yield* sequence(
    0.1,
    ...numbers_binary
      .children()
      .slice(0, 8)
      .map((c) =>
        all(c.opacity(1, 0.7, easeOutCubic), c.scale(1, 0.7, easeOutBack))
      )
  );
  yield* all(
    numbers_binary.y(-numbers_binary.y(), 3),
    numbers_decimal.y(-numbers_decimal.y(), 3)
  );
  view.add(container);

  yield* waitUntil("sub");
  const panel = (
    <Rect x={1200} y={-100}>
      <Txt
        fontFamily={"Poppins"}
        textAlign={"center"}
        fontSize={120}
        fill={"white"}
      >
        {`Subtraction circuit`}
      </Txt>
    </Rect>
  ) as Txt;
  const subsubtitle = (
    <Glass y={200} width={1000} height={200}>
      <GlassBodyText
        zIndex={1}
        fontFamily={"Fira Code"}
        text={"A - B = A + (~B + 1)"}
      />
    </Glass>
  );
  panel.save();
  panel.scale(0);
  panel.x(2000);

  panel.add(subsubtitle);
  view.add(panel);
  yield* all(container().x(container().x() - 800, 1), panel.restore(2));

  yield* all(
    line().opacity(0.1, 1),
    numbers_binary.opacity(0.25, 1),
    numbers_decimal.opacity(0.25, 1),
    panel.position([0, -200], 1.5),
    panel.scale(2, 1.5)
  );

  yield* waitUntil("signed bit");
  const integer = createRef<Bitnumber>();
  const value = createRef<GlowPanelTitle>();
  view.add(<Bitnumber bits={8} scale={2.7} x={-160} ref={integer} />);
  view.add(
    <GlowPanelTitle
      y={400}
      fontSize={200}
      fill={"rgba(248, 235, 56, 1)"}
      text={"  "}
      fontFamily={"Fira Code"}
      ref={value}
      scale={0}
    />
  );

  yield* all(panel.y(2500, 2), integer().pop(), container().opacity(0, 1));
  const signbit = integer().childAs<Rect>(2);
  yield* all(signbit.fill("#ffff0062", 1));
  yield* waitUntil("indicates");
  yield* all(integer().y(-200, 1), value().popIn());

  yield* waitUntil("examples");
  yield* loop(5, (i) => {
    const isNegative = i % 2 === 0; // even = negative

    // Choose a raw 8-bit number
    const number = isNegative
      ? generator.nextInt(128, 256) // negative 8-bit range
      : generator.nextInt(0, 128); // positive 8-bit range

    // Convert raw 8-bit to signed integer
    const signed = isNegative ? number - 256 : number;

    integer().load(number);

    return all(
      signbit.fill(isNegative ?  "#ff22ff62" : "#ffff0062", 1),
      chain(
        value().opacity(0, 0.3),
        value().text(signed.toString(), 0),
        value().opacity(1, 0.3)
      )
    );
  });

  yield* waitUntil('other numbers');
  yield* all(integer().pop(), value().popOut());
  const binary = (
    <Bitnumber number={6} bitgroups={2} showDecimal={1} scale={2} />
  ) as Bitnumber;
  view.add(binary);
  const steps = (
    <Rect layout direction={"column"} gap={30} y={200}>
      <Txt
        fontFamily={"Poppins"}
        fill={"#fffd"}
        shadowBlur={12}
        shadowColor={"#fff3"}
        fontSize={140}
        opacity={0}
        scale={0.7}
      >
        1. Invert the number
      </Txt>

      <Txt
        fontFamily={"Poppins"}
        fill={"#fffd"}
        shadowBlur={12}
        shadowColor={"#fff3"}
        fontSize={140}
        opacity={0}
        scale={0.7}
      >
        2. Add one
      </Txt>
    </Rect>
  );
  view.add(steps);

  yield* waitFor(0.5);
  yield* binary.pop();
  yield* waitUntil("~bits");
  yield* binary.y(binary.y() - 200, 1);
  yield all(
    steps.childAs<Txt>(0).scale(1, 0.4, easeOutCubic),
    steps.childAs<Txt>(0).opacity(1, 0.4, easeOutCubic)
  );
  binary.load(~6);
  yield* waitUntil("+1");
  yield all(
    steps.childAs<Txt>(1).scale(1, 0.4, easeOutCubic),
    steps.childAs<Txt>(1).opacity(1, 0.4, easeOutCubic)
  );
  binary.load(~6 + 1);
  yield* waitUntil("with 3");
  binary.load(3);
  yield* all(steps.opacity(0, 1), binary.y(0, 1));
  yield* waitUntil("solve");
  binary.load(~3);
  yield* waitFor(0.8);
  binary.load(~3 + 1);


  yield* waitUntil("next");
});
