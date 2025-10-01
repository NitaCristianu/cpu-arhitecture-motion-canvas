import {
  Circle,
  Code,
  Icon,
  invert,
  Layout,
  makeScene2D,
  Ray,
  Rect,
  Txt,
} from "@motion-canvas/2d";
import {
  all,
  waitFor,
  waitUntil,
  Vector2,
  sequence,
  easeOutSine,
  useRandom,
  delay,
  chain,
  easeInSine,
  Color,
  createSignal,
  easeOutCirc,
  easeInOutSine,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  run,
  range,
  easeInBack,
  easeOutBack,
  easeOutCubic,
} from "@motion-canvas/core";
import { createScene } from "../components/presets";
import { Vector3 } from "three";
import { buildCPULevel3 } from "../utils/cpus/buildCPULevel3";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { Label3D } from "../components/Label3D";
import Model from "../libs/Thrash/objects/Model";
import { addTowerSpotlight } from "../libs/Thrash/components/showlight";
import COLORS from "../utils/colors";
import { ShaderBackground } from "../components/background";
import { createInfoCard } from "../utils/infocard";
import { Glass } from "../components/GlassRect";

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(-1.5, 0.5, -1.5));
  const cpu = buildCPULevel3(scene);

  const generator = useRandom(0);

  view.add(scene);
  scene.init();

  const camera = scene.getCameraClass();
  const initialCameraPosition = camera.localPosition().clone();
  yield* camera.lookTo(new Vector3(0, -0.5, 0), 0);
  yield* camera.lookTo(new Vector3(0, -0.5, 0), 0);
  yield* all(cpu.group.popIn(1), cpu.ram.popIn(1, RAM_SCALE));
  // yield* cpu.initWires(cpu.wires, 1);

  scene.scene.updateMatrixWorld(true);

  const upAxis = new Vector3(0, 1, 0);

  const bpPosition = cpu.bp.getGlobalPosition();
  const spPosition = cpu.sp.getGlobalPosition();
  const cachePosition = cpu.cache.getGlobalPosition();
  const fpuPosition = cpu.fpu.getGlobalPosition();

  const computeApproach = (
    target: Vector3,
    distance = 0.75,
    elevation = 0.4,
    lateralBias = 0
  ) => {
    const toInitial = initialCameraPosition.clone().sub(target);
    if (toInitial.lengthSq() < 1e-4) {
      toInitial.set(1, 0, -1);
    }
    toInitial.normalize();

    let lateral = new Vector3().crossVectors(upAxis, toInitial);
    if (lateral.lengthSq() < 1e-4) {
      lateral = new Vector3(1, 0, 0);
    } else {
      lateral.normalize();
    }

    return target
      .clone()
      .add(toInitial.multiplyScalar(distance))
      .add(upAxis.clone().multiplyScalar(elevation))
      .add(lateral.multiplyScalar(lateralBias));
  };

  const bpView = computeApproach(bpPosition, 0.75, 0.42, -0.18);
  const spView = computeApproach(spPosition, 0.72, 0.38, 0.18);
  const fpuView = computeApproach(fpuPosition, 0.85, 0.4, 0.12);

  const toInitialFromCache = initialCameraPosition.clone().sub(cachePosition);
  if (toInitialFromCache.lengthSq() < 1e-4) {
    toInitialFromCache.set(1, 0, 0);
  }
  toInitialFromCache.normalize();

  let cacheRight = toInitialFromCache.clone().cross(upAxis);
  if (cacheRight.lengthSq() < 1e-4) {
    cacheRight = new Vector3(0, 0, 1);
  } else {
    cacheRight.normalize();
  }

  const cacheOrbitRadius = 0.85;
  const cacheOrbitHeight = 0.34;
  const cacheOrbitAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const cacheOrbitWaypoints = cacheOrbitAngles.map((angle) => {
    const forwardComponent = toInitialFromCache
      .clone()
      .multiplyScalar(Math.cos(angle) * cacheOrbitRadius);
    const rightComponent = cacheRight
      .clone()
      .multiplyScalar(Math.sin(angle) * cacheOrbitRadius);
    return cachePosition
      .clone()
      .add(forwardComponent)
      .add(rightComponent)
      .add(upAxis.clone().multiplyScalar(cacheOrbitHeight));
  });

  yield* waitUntil("begin");

  const showlight = addTowerSpotlight(scene, new Vector3(0, 1, 0), 1);

  const names = ["BP", "SP", "CACHE", "FPU"];
  const components = [cpu.bp, cpu.sp, cpu.cache, cpu.fpu];

  // Resolve per-component colors before constructing labels
  const safeGetHex = (meshLike: any, fallback: number) => {
    try {
      const mat =
        typeof meshLike.material === "function"
          ? meshLike.material()
          : meshLike.material;
      const col = mat?.color;
      if (col && typeof col.getHex === "function") return col.getHex();
    } catch {}
    return fallback;
  };
  const bpHex = safeGetHex(cpu.bp, 0x0077c2);
  const spHex = safeGetHex(cpu.sp, 0x009688);
  const cacheHex = COLORS.cache;
  const fpuHex = safeGetHex(cpu.fpu, COLORS.fpu);
  const hexes = [bpHex, spHex, cacheHex, fpuHex];

  const labels = names.map(
    (name, i) =>
      (
        <Label3D
          text={name}
          offset2D={[0, -800]}
          fontSize={128}
          width={600}
          height={200}
          worldPosition={() => components[i].getGlobalPosition()}
          scene={scene}
          translucency={0.5}
          textColor={new Color(hexes[i]).brighten(2)}
        />
      ) as Label3D
  );
  labels.map((lbl) => view.add(lbl));

  // Tint label glass to a subtle version of the component color
  labels.forEach((lbl, i) => {
    const base = new Color(hexes[i]);
    lbl.shadowColor(base);
    lbl.fill(base.alpha(0.12));
  });

  const highlightTarget = (target: Model) =>
    chain(
      waitFor(1),
      all(
        target.moveBack(0.05, 1.5, easeOutSine),
        target.expand(),
        target.expand(),
        showlight.lookAt(target.getGlobalPosition(), 1.5),
        showlight.moveTo(
          target.getGlobalPosition().clone().add(new Vector3(0, 1, 0)),
          1.5
        ),
        // Pop in the appropriate label for the highlighted target
        (() => {
          const idx = components.indexOf(target as any);
          const lbl = idx >= 0 ? labels[idx] : null;
          return lbl ? lbl.popIn() : waitFor(0);
        })()
      )
    );

  yield delay(1, showlight.fadeIn());
  yield highlightTarget(cpu.bp);
  yield* all(
    camera.followWaypoints([bpView], 2.2, {}, easeInSine),
    camera.lookTo(bpPosition, 2.2)
  );

  yield highlightTarget(cpu.sp);
  yield* all(
    camera.followWaypoints([spView], 2.2, {}, easeOutSine),
    camera.lookTo(spPosition, 2.2)
  );

  const cacheEntry = cacheOrbitWaypoints[0];
  yield highlightTarget(cpu.cache);
  yield* all(
    camera.followWaypoints([cacheEntry], 1.8),
    camera.lookTo(cachePosition, 1.8)
  );

  yield delay(1, cpu.ram.moveDOWN(0.1, 1.5));
  yield* camera.followWaypoints(cacheOrbitWaypoints, 6, {
    closed: true,
    includeCurrentPosition: true,
    tension: 0.4,
  });

  yield highlightTarget(cpu.fpu);
  yield* all(
    camera.followWaypoints([fpuView], 3),
    camera.lookTo(fpuPosition, 3)
  );
  yield showlight.fadeOut();

  const fade = createSignal(0);
  const fade2 = createSignal(0);
  view.add(
    <Rect zIndex={2} size={"100%"} fill={"#0b010eff"} opacity={fade}>
      <ShaderBackground opacity={() => fade2() / 3} preset="fpu" />
    </Rect>
  );
  const fputext = labels[labels.length - 1].findFirst(
    (node) => node instanceof Txt
  );
  const clone = fputext.clone({ zIndex: 2 });
  clone.absolutePosition(fputext.absolutePosition);
  view.add(clone);

  yield* fade(1, 1);
  yield* all(
    clone.fontSize(512, 1.3, easeOutCirc),
    clone.position(0, 1.5, easeInOutSine),
    clone.fill("white", 1.5),
    clone.shadowBlur(135, 1.5),
    clone.shadowColor("#fffa", 1.5),
    fade2(1, 2)
  );
  scene.remove();
  labels.forEach((lbl) => lbl.remove());
  const floatingtitle = (
    <Txt
      text={"Floating point numbers"}
      fontFamily={"Poppins"}
      fontWeight={800}
      fill={"white"}
      shadowBlur={130}
      shadowColor={"#fffa"}
      y={1300}
      fontSize={250}
      scale={0.5}
      zIndex={2}
    />
  ) as Rect;
  view.add(floatingtitle);
  const ray = (
    <Ray
      zIndex={2}
      end={0}
      from={clone.bottom}
      to={floatingtitle.top}
      lineWidth={13}
      stroke={"white"}
      endArrow
    >
      {range(4).map((i) => (
        <Rect
          position={() => ray.getPointAtPercentage(0.2 * i + 0.1).position}
          size={[300, 100]}
          radius={64}
          stroke={"white"}
          lineWidth={6}
          fill={"#190821ff"}
          scale={0}
        >
          <Txt
            text={`${2000 - i * 10}`}
            fontFamily={"Poppins"}
            fill={"white"}
          ></Txt>
        </Rect>
      ))}
    </Ray>
  ) as Ray;
  view.add(ray);

  // Operations list to showcase
  const operations = [
    "3.2 + 1.4 = 4.6",
    "5.0 - 2.75 = 2.25",
    "2.5 × 8 = 20",
    "10 ÷ 4 = 2.5",
    "sqrt(2) ≈ 1.4142",
    "7.5 + 3.25 = 10.75",
    "9.6 - 4.1 = 5.5",
    "12.3 × 0.5 = 6.15",
    "15.0 ÷ 6 = 2.5",
    "sqrt(3) ≈ 1.7321",
    "4.2 + 8.8 = 13.0",
    "6.4 - 2.05 = 4.35",
    "3.75 × 2.4 = 9.0",
    "7.2 ÷ 0.3 = 24.0",
    "sqrt(5) ≈ 2.2361",
  ];

  // Vertical list of dark rectangles containing code lines
  const normalHeight = 220;
  const list = (
    <Layout layout direction={"column"} gap={40} zIndex={2} top={[0, 1400]}>
      {operations.map((op) => (
        <Rect
          height={0}
          fill={"#00000066"}
          radius={64}
          zIndex={2}
          justifyContent={"center"}
          paddingLeft={50}
          paddingRight={50}
          alignItems={"center"}
        >
          <Code scaleY={0} code={op} fontSize={96} x={-20} top={[0, -10]} />
        </Rect>
      ))}
    </Layout>
  ) as Layout;
  view.add(list);

  yield* all(
    clone.y(-1630, 1.5),
    floatingtitle.y(0, 1.5, easeOutSine),
    floatingtitle.scale(1, 1),
    ray.end(1, 1),
    sequence(0.2, ...ray.children().map((child) => child.scale(1, 1)))
  );
  const items = list.children() as Rect[];
  yield sequence(
    0.2,
    ...items.map((item) =>
      all(
        item.height(normalHeight, 0.6, easeOutSine),
        item.childAs<Code>(0).scale(1, 1)
      )
    )
  );

  yield* waitFor(1);
  const aluImage = (
    <Rect y={3300} fill={"red"} width={1000} height={700} zIndex={2} />
  );
  yield* [list, floatingtitle, aluImage].map((component) =>
    all(component.y(component.y() - 2500, 3, easeInOutExpo))
  );
  view.add(aluImage);
  yield* waitFor(3);

  const alu_components = (
    [
      { name: "LU", glyph: "D", icon: null },
      { name: "AU", icon: "mdi:calculator-variant", glyph: null },
      { name: "FPU", glyph: ".00", icon: null },
    ] as const
  ).map(({ name, icon, glyph }) => (
    <Glass
      size={600}
      fill={"rgba(63, 84, 127, 0.6)"}
      radius={1000}
      scale={0}
      zIndex={2}
      removeShadow={1}
    >
      {icon ? (
        <Icon zIndex={1} icon={icon} color={"#fffd"} width={260} y={-40} />
      ) : (
        <Txt
          fontFamily={"Poppins"}
          fontWeight={800}
          fontSize={200}
          fill={"#fffd"}
          shadowBlur={16}
          shadowColor={"#fff3"}
          y={-40}
          zIndex={1}
        >
          {glyph}
        </Txt>
      )}
      <Txt
        fontFamily={"Poppins"}
        fontSize={56}
        fontWeight={700}
        fill={"#fffd"}
        shadowBlur={12}
        shadowColor={"#fff3"}
        y={190}
        zIndex={2}
      >
        {name}
      </Txt>
    </Glass>
  ));
  alu_components.forEach((comp) => view.add(comp));

  yield* all(
    list.y(1500, 0.5, easeInExpo),
    list.scale([0, 0.5], 1, easeInOutExpo),
    delay(0.5, aluImage.y(300, 1, easeOutSine))
  );

  const context_title = createInfoCard("ALU COMPONENTS", {
    props: { top: [0, -view.size().y / 2 - 250], zIndex: 2 },
    width: 1900,
  });
  view.add(context_title.node);

  yield* waitUntil("break");
  yield context_title.node.y(context_title.node.y() + 350, 1);
  yield aluImage.scale(0, 0.4, easeInBack);
  yield* sequence(
    0.15,
    ...alu_components.map((child, i) =>
      all(
        child.scale(1, 0.6, easeOutBack),
        child.position([-1000 + i * 1000, -100], 0.6)
      )
    )
  );

  const registers = range(2).map(
    (i) =>
      (
        <Glass
          width={i == 0 ? 900 : 1050}
          height={200}
          position={new Vector2(-500 + i * 1500, 500)}
          zIndex={2}
          scale={0}
        >
          <Txt
            zIndex={1}
            text={["INT", "FLOAT"][i] + " REGISTERS"}
            fontSize={120}
            fontFamily={"Poppins"}
            shadowBlur={10}
            shadowColor={"#000a"}
            fill={"white"}
          />
        </Glass>
      ) as Rect
  );
  const rays = alu_components.map(
    (child: Rect, i) =>
      (
        <Ray
          from={child.bottom}
          end={0}
          to={i < 2 ? registers[0].top : registers[1].top}
          lineWidth={12}
          lineDash={[30, 30]}
          stroke={"white"}
          zIndex={2}
          endOffset={90}
          startOffset={50}
          endArrow
        />
      ) as Ray
  );
  rays.forEach((r) => view.add(r));
  yield* waitUntil("registers");
  registers.forEach((reg) => view.add(reg));
  yield all(...rays.map((ray) => ray.end(1, 0.5)));
  yield* sequence(
    0.2,
    ...registers.map((reg) =>
      all(reg.scale(1, 0.5, easeOutCubic), reg.y(reg.y() + 100, 1))
    )
  );

  yield* waitUntil("separate");
  yield* all(
    context_title.node.y(context_title.node.y() - 350, 1),
    registers[1].x(0, 1),
    registers[0].x(-2600, 1),
    alu_components[2].x(0, 1),
    alu_components[1].x(-2500, 1),
    alu_components[0].x(-2500, 1)
  );

  yield* waitUntil('aluchip');
  rays.forEach((r, i)=>i != 2 ? r.remove() : null);

  const alu = alu_components[2].clone({ zIndex: 2 }) as Glass;
  alu.findFirst(n=>n instanceof Txt).remove();
  alu.findLast(n=>n instanceof Txt).text("ALU");
  // start at FPU tile position, hidden
  alu.position(alu_components[2].position());
  alu.scale(0);
  // update bottom label to "ALU" and swap glyph to calculator icon
  try { alu.childAs<Txt>(1).text("ALU", 0); } catch {}
  try { alu.childAs<Txt>(0).scale(0, 0); } catch {}
  alu.add(
    <Icon zIndex={1} icon={"mdi:calculator-variant"} color={"#fffd"} width={260} y={-40} />
  );
  view.add(alu);

  // create connection ray from ALU clone to INT registers
  const aluRay = (
    <Ray
      from={alu.bottom}
      to={registers[0].top}
      end={0}
      lineWidth={12}
      lineDash={[30, 30]}
      stroke={"white"}
      zIndex={2}
      endOffset={90}
      startOffset={50}
      endArrow
    />
  ) as Ray;
  view.add(aluRay);

  const title = <Txt
    fill={'white'}
    shadowBlur={50}
    shadowColor={"#fff5"}
    zIndex={2}
    y={-740}
    fontSize={120}
    scaleY={0}
    fontWeight={700}
    opacity={.7}
  >They became two separate chips.</Txt>;
  view.add(title);

  // pop-in, move clone to the right, shift FPU left, and draw the ray
  yield* all(
    alu.scale(1, 0.6, easeOutBack),
    alu.position([600, -100], 0.8, easeInOutExpo),
    alu_components[2].position([-600, -100], 0.8, easeInOutExpo),
    delay(.2,aluRay.end(1, 0.8, easeOutSine)),
    registers[0].x(600, .8, easeOutBack),
    registers[1].x(-600, .8, easeOutBack)
  );
  yield* title.scale(1,.7)

  yield* waitUntil('show bits');
  const bits = [64, 128].map((n,i)=><Txt
    fill={'white'}
    text={`${n} bits`}
    shadowBlur={50}
    shadowColor={"#fff5"}
    zIndex={2}
    scale={0}
    position={registers[1].position}
    fontSize={120}
    fontWeight={700}
    opacity={.7}
  ></Txt>);
  bits.forEach(bit=>view.add(bit));

  yield* registers[1].y(350,1);
  yield* sequence(.5, ...bits.map((bit,i)=>all(
    bit.position(bit.position().addY(50+150*(i+1)), 1),
    bit.scale(1,.7,easeOutBack),
  )))

  yield* waitUntil("next");
});
