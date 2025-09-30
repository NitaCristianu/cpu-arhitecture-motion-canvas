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

  const alu_components = [{ name: "lu" }, { name: "au" }, { name: "fpu" }].map(
    (data) => <Glass size={600} fill={"black"} radius={1000} scale={0} zIndex={2}>
      <Icon icon={""}/>
      <Txt></Txt> her iwll be on the bottom
    </Glass>
  );
  alu_components.forEach((comp) => view.add(comp));

  yield* all(
    list.y(1500, 0.5, easeInExpo),
    list.scale([0, 0.5], 1, easeInOutExpo),
    delay(0.5, aluImage.y(300, 1, easeOutSine))
  );

  const context_title = createInfoCard("ALU COMPONENTS", {
    props: { top: [0, -view.size().y / 2 - 250], zIndex :2 },
    width: 1900,
  });
  view.add(context_title.node);

  yield context_title.node.y(context_title.node.y() + 350, 1)
  yield aluImage.scale(0,.4,easeInBack)
  yield* sequence(
    0.15,
    ...alu_components.map(
      (child, i) => all(child.scale(1, .6, easeOutBack), child.position([-1000 + i * 1000, 0],.6))
    )
  );

  yield* waitUntil("next");
});
