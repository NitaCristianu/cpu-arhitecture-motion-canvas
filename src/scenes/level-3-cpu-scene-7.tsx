import {
  Code,
  Grid,
  Line,
  lines,
  makeScene2D,
  Ray,
  Ray,
  Ray,
  Txt,
} from "@motion-canvas/2d";
import {
  all,
  chain,
  createRefArray,
  createSignal,
  delay,
  easeInBack,
  easeInOutCubic,
  easeInOutSine,
  easeInSine,
  easeOutBack,
  easeOutSine,
  linear,
  loop,
  range,
  run,
  sequence,
  tween,
  useRandom,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { createScene } from "../components/presets";
import { Vector2, Vector3 } from "three";
import { buildCPULevel3 } from "../utils/cpus/buildCPULevel3";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { Label3D } from "../components/Label3D";
import {
  GlassBodyText,
  GlowBadge,
  GlowPanelTitle,
} from "../components/TextPresets";
import { ShaderBackground } from "../components/background";
import { createInfoCard } from "../utils/infocard";
import { Bitnumber } from "../utils/bitnumber";
import { Glass } from "../components/GlassRect";
import { AsmHighlighter } from "../utils/AsmHighlighter";
import { CPP_Highlight } from "../utils/CodeHighlighter";

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(-1.5, 0.5, -1.5));
  const cpu = buildCPULevel3(scene);

  const generator = useRandom(0);

  const camera = scene.getCameraClass();

  view.add(scene);
  scene.init();

  yield* waitUntil("begin");
  yield* camera.moveTo(
    cpu.fpu
      .getGlobalPosition()
      .add(new Vector3(0.9, 0.5, 0.4).multiplyScalar(2)),
    0
  );
  yield* camera.lookTo(
    cpu.fpu.getGlobalPosition().add(new Vector3(0.1, -0.1, 0.05)),
    0
  );
  yield* all(cpu.cache.moveForward(2, 0), cpu.ram.moveLeft(0.1, 0));
  yield* all(cpu.group.popIn(1), cpu.ram.popIn(1, RAM_SCALE));
  yield* camera.moveTo(
    cpu.fpu
      .getGlobalPosition()
      .add(new Vector3(-0.9, 0.5, -0.4).multiplyScalar(2)),
    3,
    easeInOutSine
  );

  yield* waitUntil("electricity flow");
  yield* cpu.initWires([cpu.wire_decode_cu, cpu.wire_cu_alu, cpu.wire_alu_mc]);
  yield camera.lookTo(
    cpu.alu.getGlobalPosition().add(new Vector3(-0.2, -0.1, 0.05)),
    1
  );
  yield* cpu.wire_decode_cu.currentFlow(0.5, easeInOutSine, 150);
  yield* cpu.wire_cu_alu.currentFlow(0.5, easeInOutSine, 150);
  yield camera.lookTo(
    cpu.mc.getGlobalPosition().add(new Vector3(-0.2, 0.1, 0.05)),
    1
  );
  yield* cpu.wire_alu_mc.currentFlow(0.5, easeInOutSine, 150);

  yield* waitUntil("size");
  yield camera.lookTo(
    cpu.container.getGlobalPosition().add(new Vector3(0, -0.1, 0)),
    1
  );
  yield* cpu.container.shrink(0.2, 0.5);

  yield* waitUntil("ticks");
  yield camera.zoomIn(3.1, 1);
  yield camera.lookTo(
    cpu.clock.getGlobalPosition().add(new Vector3(-0.45, -0.1, 0)),
    1
  );
  yield* cpu.container.expand(5, 0.5);
  yield cpu.initWires([cpu.wire_clock_cu]);
  yield* loop(3, () => cpu.wire_clock_cu.currentFlow(0.25, easeOutSine, 120));

  yield* waitUntil("fetching");
  yield* camera.zoomOut(1 / 3.1, 1);
  yield* camera.lookTo(
    cpu.container.getGlobalPosition().add(new Vector3(0, -0.1, -0.25)),
    1
  );
  yield* camera.zoomOut(2, 1, easeInOutSine);

  yield* waitUntil("introduce cache");
  yield* all(cpu.cache.moveBack(2, 1), cpu.ram.moveRight(0.2, 1));

  yield* waitUntil("whatis");
  yield* all(
    camera.moveTo(new Vector3(0.75, 4, 0), 1),
    camera.lookTo(new Vector3(0.75 + 0.01, 0, 0), 0.8, easeInOutCubic)
  );
  yield* cpu.initWires([
    cpu.wire_cache_ram_address,
    cpu.wire_cache_ram_data,
    cpu.wire_mc_cache_data,
    cpu.wire_mc_cache_address,
  ]);

  const data_dialogue = (
    <Label3D
      scene={scene}
      worldPosition={cpu.cache.getGlobalPosition()}
      text={
        "I store now the number at X.\nI will return the value to the CPU.\nNext time the CPU will need X I will\nreturn it without fetching from RAM."
      }
      offset2D={[-1000, -500]}
      height={350}
      width={900}
      color="memory"
    />
  ) as Label3D;
  view.add(data_dialogue);
  const address_dialogue = (
    <Label3D
      scene={scene}
      worldPosition={cpu.cache.getGlobalPosition()}
      text={
        "CPU requested number at X.\nI don't store the number\nso I will fetch from ram."
      }
      offset2D={[1000, -500]}
      height={250}
      width={900}
      color="sky"
    />
  ) as Label3D;
  view.add(data_dialogue);
  view.add(address_dialogue);
  yield* waitUntil("communicate");
  yield* cpu.wire_mc_cache_address.currentFlow(0.4, easeInSine, 100);
  yield* address_dialogue.popIn(0.5);
  yield* waitFor(0.5);
  yield* cpu.wire_cache_ram_address.currentFlow(0.4, easeInSine, 100);
  yield* cpu.wire_cache_ram_data.reverseFlow(0.4, easeInSine, 100);
  yield* data_dialogue.popIn(0.5);
  yield* cpu.wire_mc_cache_data.reverseFlow(0.4, easeInSine, 100);

  yield* waitUntil("post 3d scene");
  yield* all(address_dialogue.popOut(), data_dialogue.popOut());

  yield camera.zoomIn(2.3, 3, easeInOutCubic);
  yield camera.lookDown(0.35, 3, easeInOutCubic);
  yield* camera.moveTo(
    camera.localPosition().clone().add(new Vector3(-1, -3, -4)),
    3,
    easeInOutCubic
  );

  yield loop((i) =>
    i % 2
      ? cpu.wire_mc_cache_address.currentFlow(0.4, easeInSine, 100)
      : i % 3 == 0
      ? cpu.wire_mc_cache_data.currentFlow(0.4, easeInSine, 100)
      : cpu.wire_mc_cache_data.reverseFlow(0.4, easeInSine, 100)
  );

  yield* waitUntil("mainmemory");
  const cache_pos = camera.lookAt().clone();
  yield* camera.lookTo(cpu.ram.getGlobalPosition());

  const shaderBgr = <ShaderBackground preset="goldenHour" opacity={0} />;
  view.add(shaderBgr);
  const spacing = createSignal<Vector2>(new Vector2(100, 100));
  const cache_titles = createRefArray<Txt>();
  const cache_contents = (
    <Label3D
      scene={scene}
      worldPosition={cpu.cache.getGlobalPosition()}
      text={""}
      offset2D={[0, -500]}
      height={600}
      width={1200}
      color="control"
      clip
    >
      <Grid
        lineWidth={2}
        stroke={"#fff5"}
        size="100%"
        spacing={spacing}
        zIndex={1}
      />
      {...range(12).flatMap((x) =>
        range(6).map((y) => (
          <GlowPanelTitle
            scale={0}
            ref={cache_titles}
            text={
              generator.nextInt(0, 2) == 0
                ? "0x" + generator.nextInt(0, 256).toString(16)
                : generator.nextInt(0, 16).toString(2)
            }
            fontWeight={300}
            fontSize={30}
            fontFamily={"Fira Code"}
            x={() => x * spacing().x - spacing().x * 5.5}
            y={() => y * spacing().y - spacing().y * 2.5}
            fill={"white"}
            zIndex={1}
          />
        ))
      )}
    </Label3D>
  ) as Label3D;
  const title = (
    <GlowBadge
      scale={0}
      text={"CACHE CONTENTS"}
      bottom={cache_contents.top}
      padding={10}
    />
  );
  view.add(title);

  view.add(cache_contents);

  yield* waitUntil("lookat cache");
  yield* camera.lookTo(cache_pos, 1.5, easeInOutCubic);
  yield* title.scale(1, 0.5, easeOutBack);
  yield cache_contents.offset2D([-1200, -500], 1.5);
  yield cache_contents.scale(1.5, 0.8, easeOutSine);
  yield* sequence(
    0.025,
    ...cache_titles.map((d) => d.scale(1, 0.5, easeOutBack))
  );

  yield loop(7, (i) => {
    const randompositions = generator.intArray(
      generator.nextInt(0, 10),
      0,
      cache_titles.length
    );
    return sequence(
      0.01,
      ...randompositions.map((pos) =>
        cache_titles[pos].text(
          generator.nextInt(0, 2) == 0
            ? "0x" + generator.nextInt(0, 256).toString(16)
            : "",
          0.4
        )
      )
    );
  });

  // NOTES FOR ANDREI IN THE FUTURE! THIS PART IS DEPENDENT OF THE RANDOM GENERATION SO DON'T CHANGE META

  yield* waitUntil("cache principles");
  yield* all(
    cache_contents.scale(5, 2.3),
    cache_contents.position([250, 250], 1)
  );
  const selectedINDEX = 32;
  const item = cache_titles[selectedINDEX];
  yield* all(
    item.fill("rgba(240, 209, 96, 1)", 0.9),
    item.scale(1.2, 1),
    item.shadowColor("#f7c81f80", 0.9)
  );

  view.fill("rgba(10, 7, 2, 1)");
  yield* all(
    shaderBgr.opacity(0.4, 1.2, easeOutBack).do(() => scene.remove()),
    cache_contents.translucency(0, 1)
    // .do(() => cache_contents.disableShader(false))
  );

  yield* waitUntil("spatial");
  yield cache_contents.x(cache_contents.x() - 1000, 2);
  yield all(
    ...cache_titles.map((t, i) =>
      i % 6 != selectedINDEX % 6 ? all(t.opacity(0.2, 1)) : null
    ),
    cache_contents.findFirst((c) => c instanceof Grid).opacity(0.1, 1)
  );

  const context_title = createInfoCard(
    "Spatial Locality (neighbours will be used)",
    {
      props: {
        top: [0, -view.size().y / 2 - 250],
      },
      fontSize: 120,
      width: 2200,
      noShader: true,
    }
  );
  view.add(context_title.node);
  yield* context_title.node.y(context_title.node.y() + 350, 1);

  yield* sequence(
    0.3,
    ...range(5).map((i) =>
      run(function* () {
        const neighbor_index = i * 6 + selectedINDEX;
        const item = cache_titles[neighbor_index];
        yield* all(
          item.fill("rgba(240, 209, 96, 1)", 0.9),
          item.shadowColor("#f7c81f80", 0.9),
          item.scale(1.2, 1)
        );
      })
    )
  );

  yield* waitUntil("temporal locality");
  yield context_title.node
    .findFirst((t) => t instanceof Txt)
    .text("Temporal Locality (data will be reused)", 0.9);
  yield cache_contents.x(cache_contents.x() + 1000, 2);
  yield* sequence(
    0.05,
    ...range(5).map((i) =>
      run(function* () {
        const neighbor_index = (5 - i) * 6 + selectedINDEX;
        const item = cache_titles[neighbor_index];
        yield* all(
          item.fill("rgba(255, 255, 255, 1)", 0.9),
          item.shadowColor("#f8f8f880", 0.9),
          item.scale(1, 1)
        );
      })
    )
  );
  yield* loop(4, () => item.scale(1.4, 0.5).back(0.5));

  yield* waitUntil("show principles");

  yield context_title.node.y(0, 1);
  yield context_title.node
    .findFirst((t) => t instanceof Txt)
    .text(
      "1.Spatial Locality (neighbours will be used)\n2.Temporal Locality (data will be reused)",
      0.9
    );
  yield* all(...cache_titles.map((t, i) => all(t.opacity(0.1, 1))));

  yield* waitUntil("split lines");

  const start_spacing = spacing();
  const final_spacing = new Vector2(100, 300);

  const grid = cache_contents.findFirst((c) => c instanceof Grid);
  const grid_lines = range(6).map((i) => {
    const l = (
      <Ray
        stroke={grid.stroke()}
        zIndex={2}
        y={() =>
          grid.top().add(spacing().y * (i - 0.45) * cache_contents.scale().y).y
        }
        lineWidth={5}
        opacity={0}
        x={cache_contents.x}
        fromX={() => (-cache_contents.size.x() * cache_contents.scale().x) / 2}
        toX={() => (cache_contents.size.x() * cache_contents.scale().x) / 2}
        start={i == 5 ? 0.05 : 0}
        end={i == 5 ? 0.95 : 1}
      />
    );

    view.add(l);

    return l;
  });

  yield* all(
    item.fill("rgba(255, 255, 255, 1)", 0.9),
    item.shadowColor("#f8f8f880", 0.9),
    item.scale(1, 1),
    context_title.node.scale(0, 1, easeInBack),
    all(...cache_titles.map((t, i) => all(t.opacity(0.8, 1))))
  );
  yield* all(
    all(...grid_lines.map((l) => l.opacity(1, 0.5))),
    grid.opacity(0, 0.5)
  );
  grid.remove();

  const coeficient = createSignal(2);
  yield* all(
    ...cache_titles.map((t) =>
      t.y(
        t.y() * coeficient() + (spacing().y * cache_contents.scale().y) / 2,
        0.5
      )
    ),
    ...grid_lines.map((l, i) =>
      l.y(
        () =>
          cache_titles[i].y() * cache_contents.scale.y() +
          110 +
          cache_contents.y(),
        0.5,
        easeInOutCubic
      )
    )
  );

  yield* all(
    cache_contents.y(100, 1),
    cache_contents.x(0, 1),
    cache_contents.scale(2.5, 1),
    cache_contents.translucency(1, 1),
    ...cache_titles.map((t) =>
      t.y(t.y() * 0.5 + (spacing().y * cache_contents.scale().y) / 2 - 370, 0.5)
    )
  );

  const bits: GlassBodyText[] = grid_lines.flatMap((l) => {
    const ammount = Math.floor(128);
    return range(1).map((i) => {
      const b = (
        <GlassBodyText
          text={"0".repeat(64) + "\n" + "0".repeat(64)}
          fontFamily={"Fira Code"}
          fontWeight={100}
          y={() => (-100 * cache_contents.scale().y) / 2}
          opacity={0}
          zIndex={1}
          scale={() => cache_contents.scale().div(2.5)}
        />
      );
      b.x((l as Line).getPointAtPercentage(0.5).position.x);
      l.add(b);
      return b;
    });
  }) as any;

  yield* waitUntil("128 bits");

  yield all(...bits.flatMap((b) => b.opacity(0.8, 1)));
  yield* all(...cache_titles.map((t) => t.opacity(0, 1).do(() => t.remove())));

  const code = (
    <Glass
      y={100}
      size={[1400, 1000]}
      translucency={1}
      borderModifier={-1}
      x={3400}
    >
      <Code
        zIndex={1}
        fontSize={95}
        width={1800}
        top={[0, -20]}
        height={600}
        highlighter={CPP_Highlight}
        code={`
int arr[8] = 
{0, 1, 2, 3, 
4, 5, 6, 7};
int first = arr[0];
// that saves in cache 
// first 4 elements
`}
      />
    </Glass>
  ) as Glass;
  view.add(code);

  yield* waitUntil("array");
  yield* all(
    cache_contents.x(-800, 1),
    cache_contents.scale(1.8, 1),
    code.x(1150, 1),
    ...bits.map((b) => all(b.y(-80, 1))),
    ...grid_lines.map((l: Ray, i) =>
      all(
        l.lineWidth(2, 1),
        l.y(
          () =>
            cache_titles[i].y() * cache_contents.scale.y() +
            80 +
            cache_contents.y(),
          0.5,
          easeInOutCubic
        )
      )
    )
  );
  yield code.childAs<Code>(0).selection(lines(4, 6), 1);
  const line = grid_lines[0].findFirst((t) => t instanceof Txt);
  yield* waitUntil("store first");
  yield* line.text(
    generator.nextInt(0, Math.pow(2, 32)).toString(2).padEnd(32, "0") +
      " " +
      "0".repeat(64 - 32) +
      "\n" +
      "0".repeat(64),
    1
  );
  yield* waitFor(0.8);
  yield* loop(1, (i) =>
    line.text(
      generator.nextInt(0, Math.pow(2, 32)).toString(2).padEnd(32, "0") +
        " " +
        range(3)
          .map(
            (j) =>
              (j <= 3
                ? generator
                    .nextInt(0, Math.pow(2, 32))
                    .toString(2)
                    .padEnd(32, "0")
                : "0".repeat(32)) + (j == 0 ? "\n" : " ")
          )
          .join(""),
      1
    )
  );

  yield* waitUntil("finds line");
  const providerGlass = (
    <Glass scale={0} lightness={1} size={700} y={0} x={1500} radius={1000}>
      <Txt fontSize={220} fill={"#0005"} zIndex={1} fontWeight={800}>
        RAM
      </Txt>
    </Glass>
  ) as Glass;
  view.add(providerGlass);

  const cpuUsage1 = (
    <Ray
      to={cache_contents.bottomRight}
      from={providerGlass.left}
      stroke={"#c3d5ffff"}
      shadowColor={"#6ab2ffff"}
      shadowBlur={40}
      lineWidth={10}
      startArrow
      endOffset={50}
      startOffset={50}
      end={0}
      lineDash={[30, 10]}
    />
  ) as Ray;
  view.add(cpuUsage1);
  const cpuUsage2 = (
    <Ray
      to={cache_contents.topRight}
      from={providerGlass.left}
      stroke={"#ff8383ff"}
      shadowColor={"#ff6a83ff"}
      shadowBlur={40}
      lineWidth={10}
      startArrow
      endOffset={50}
      startOffset={50}
      end={0}
      lineDash={[30, 10]}
    />
  ) as Ray;
  view.add(cpuUsage2);

  const info_text = (
    <GlowBadge
      y={850}
      fontSize={60}
      width={3600}
      opacity={0}
      fill={"#fff5"}
      textAlign={"center"}
      textWrap
      fontWeight={300}
      text={
        'Cache lines are more complex than this — this is a high-level explanation. In reality, lines are grouped into "sets", and each line also reserves a few bits for tags (for identification) and modifier bits (for various control purposes).'
      }
    />
  ) as GlowBadge;
  view.add(info_text);
  yield chain(info_text.popIn(), waitFor(6), info_text.popOut());

  yield* all(code.x(3000, 1));
  yield chain(
    all(
      cpuUsage1.to(cache_contents.topRight, 4, linear),
      cpuUsage2.to(cache_contents.bottomRight, 4, linear)
    ),
    all(
      cpuUsage1.to(cache_contents.bottomRight, 4, linear),
      cpuUsage2.to(cache_contents.topRight, 4, linear)
    )
  );

  yield* sequence(
    0.2,
    providerGlass.scale(1, 1, easeOutBack),
    cpuUsage1.end(1, 1),
    cpuUsage2.end(1, 1)
  );

  const ramboxes = range(5).map((i) => (
    <Glass scale={0} size={[850, 210]} y={-450 + i * 250}>
      <GlassBodyText
        zIndex={1}
        text={
          i == 3
            ? "..."
            : i > 3
            ? i == 4
              ? "Group n-1"
              : "Group n"
            : "Group " + i
        }
      ></GlassBodyText>
    </Glass>
  ));

  const connection: Ray[] = ramboxes.flatMap((box: Glass, i) => {
    const colors = [
      ["#ff8383ff", "#ff6a83ff"],
      ["#c3d5ffff", "#6ab2ffff"],
    ];
    const positions = [i, 5 - i];

    const rays = positions.map(
      (val, j) =>
        (
          <Ray
            from={box.left().add(providerGlass.position()).addX(-650)}
            to={(grid_lines[val] as Line)
              .getPointAtPercentage(1)
              .position.addY(-50)
              .add(grid_lines[val].position())}
            shadowBlur={40}
            lineWidth={10}
            stroke={colors[j][0]}
            shadowColor={colors[j][1]}
            endArrow
            endOffset={50}
            startOffset={50}
            end={0}
            lineDash={[30, 10]}
          />
        ) as Ray
    );
    view.add(rays);

    return [...rays];
  });
  providerGlass.add(ramboxes);

  yield* waitUntil("direct mapping");
  yield* all(
    sequence(0.2, cpuUsage1.start(1, 0.5), cpuUsage2.start(1, 0.5)),
    providerGlass.x(1150, 1),
    providerGlass.radius(64, 1),
    providerGlass.size([1000, 1500], 1),
    delay(
      0.4,
      sequence(0.15, ...ramboxes.map((box) => box.scale(1, 0.7, easeOutBack)))
    ),
    providerGlass.findFirst((t) => t instanceof Txt).y(-650, 1),
    providerGlass.findFirst((t) => t instanceof Txt).scale(0.5, 1),
    grid_lines[2].findFirst((t) => t instanceof Txt).text("...", 1)
  );
  yield* sequence(0.2, ...connection.map((c) => c.end(1, 0.7)));

  yield* waitUntil("next");
});
