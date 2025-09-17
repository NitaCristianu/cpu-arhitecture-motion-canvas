import { Icon, makeScene2D, Node, Txt } from "@motion-canvas/2d";
import { createScene } from "../components/presets";
import Camera from "../libs/Thrash/Camera";
import {
  all,
  any,
  createRef,
  createSignal,
  easeInBack,
  easeInQuint,
  easeInSine,
  easeOutBack,
  easeOutQuint,
  easeOutSine,
  loop,
  sequence,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { MeshPhongMaterial, MeshPhysicalMaterial, Vector3 } from "three";
import { buildCPULevel0 } from "../utils/cpus/buildCPULevel0";
import Box from "../libs/Thrash/objects/Box";
import { Label3D } from "../components/Label3D";
import { createInfoCard } from "../utils/infocard";
import { Glass } from "../components/GlassRect";
import Model from "../libs/Thrash/objects/Model";

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(3, 4, 4).divideScalar(3));
  const camera: Camera = scene.findFirst(
    (child) => (child as any) instanceof Camera
  ) as any;

  const inner_cpu = buildCPULevel0(scene);
  const outer_cpu = (
    <Box
      material={new MeshPhongMaterial({ color: 0xffa000 })}
      localScale={new Vector3(0, 0, 0)}
      localPosition={new Vector3(-0.02, -0.4, 0)}
    />
  ) as Box;

  const cpustring = createSignal("Read : 5");
  const cpustring2 = createSignal("Computing");
  const ramString = createSignal("Stored : 5");
  const cpuData = (
    <Label3D
      color="alu"
      text={cpustring}
      scene={scene}
      worldPosition={outer_cpu
        .localPosition()
        .clone()
        .add(new Vector3(0, 0.2, -0.2))}
      fontSize={120}
      offset2D={[-200, 0]}
      size={[1000, 200]}
    />
  ) as Label3D;
  const cpuData2 = (
    <Label3D
      color="control"
      text={cpustring2}
      scene={scene}
      worldPosition={outer_cpu
        .localPosition()
        .clone()
        .add(new Vector3(0, 0.2, -0.2))}
      fontSize={120}
      offset2D={[-200, 300]}
      size={[1000, 200]}
    />
  ) as Label3D;
  const cpuData3 = (
    <Label3D
      color="fpu"
      text={"Returning 6"}
      scene={scene}
      worldPosition={outer_cpu
        .localPosition()
        .clone()
        .add(new Vector3(0, 0.2, -0.2))}
      fontSize={120}
      offset2D={[-200, 600]}
      size={[1000, 200]}
    />
  ) as Label3D;
  const ramData = (
    <Label3D
      color="sky"
      text={ramString}
      scene={scene}
      worldPosition={inner_cpu.ram
        .localPosition()
        .clone()
        .add(new Vector3(0.2, 0.2, -0.1))}
      offset2D={[0, -200]}
      fontSize={120}
      size={[1000, 200]}
    />
  ) as Label3D;

  [ramData, cpuData, cpuData2, cpuData3].map((item) => view.add(item));

  // INIT SCENE -------------------------------
  yield* inner_cpu.group.rotateTo(new Vector3(-Math.PI / 2, 0, 0), 0);
  yield* camera.lookTo(new Vector3(0, -0.4, 0), 0);
  yield* inner_cpu.ram.reposition(
    inner_cpu.ram.localPosition().clone().add(new Vector3(0.02, 0, 0)),
    0
  );

  scene.add(outer_cpu);
  scene.init();

  view.add(scene);

  // ANIMATE --------------------------

  // rotate camera initially
  yield* all(
    inner_cpu.group.popIn(0, new Vector3(0.5)),
    outer_cpu.popIn(1, new Vector3(0.66, 0.02 * 5 + 0.04, 0.61)),
    inner_cpu.ram.popIn(0.5, new Vector3(0.2, 0.6, 0.25))
  );
  yield* all(
    inner_cpu.wire_mc_ram_address.widthTo(11, 1),
    inner_cpu.wire_mc_ram_data.widthTo(10, 1)
  );
  yield* all(
    camera.moveTo(new Vector3(0.5, 4, 2).divideScalar(2), 2),
    camera.lookTo(new Vector3(0.5, -0.7, 0).divideScalar(2), 2)
  );
  yield* all(
    ramData.popIn(),
    inner_cpu.wire_mc_ram_address.reverseFlow(0.6, easeInSine, 50)
  );

  yield* all(
    cpuData.popIn(),
    inner_cpu.wire_mc_ram_address.reverseFlow(0.6, easeInSine, 50),
    camera.lookTo(inner_cpu.group.localPosition(), 0.9),
    camera.zoomTo(1.5, 0.9)
  );

  yield* waitFor(0.5);
  yield* all(cpuData2.popIn());
  yield* loop(9, (i) => cpustring2("Computing" + ".".repeat((i % 3) + 1), 0.2));
  yield* cpuData3.popIn();
  yield* any(
    camera.lookTo(inner_cpu.ram.localPosition()),
    inner_cpu.wire_mc_ram_data.currentFlow(0.6, easeInSine, 50)
  );
  yield* ramString("Now stores : 6", 0.5);
  yield* waitUntil("reverse");
  const context_title = createInfoCard("LEVEL 0 CPU", {
    width: 1600,
    props: { top: [0, -view.size().y / 2 - 250] },
  });
  view.add(context_title.node);
  yield* any(
    camera.moveTo(new Vector3(0.5, 5, 1).divideScalar(2), 2),
    camera.lookTo(new Vector3(0.5, -0.7, 0).divideScalar(2), 2),
    camera.zoomTo(1, 2),
    ...[cpuData, cpuData2, cpuData3, ramData].map((item) => item.popOut()),
    context_title.node.position(context_title.node.position().add([0, 500]), 1)
  ),
    yield* all(
      outer_cpu.reposition(new Vector3(0.25, -0.4, 0)),
      inner_cpu.ram.popOut(),
      inner_cpu.wire_mc_ram_address.updatePoints(
        [
          inner_cpu.wire_mc_ram_address.getPointAt(0),
          inner_cpu.wire_mc_ram_address.getPointAt(0),
          inner_cpu.wire_mc_ram_address.getPointAt(0),
        ],
        1
      ),
      inner_cpu.wire_mc_ram_data.updatePoints(
        [
          inner_cpu.wire_mc_ram_data.getPointAt(0),
          inner_cpu.wire_mc_ram_data.getPointAt(0),
          inner_cpu.wire_mc_ram_data.getPointAt(0),
        ],
        1
      )
    );
  yield* inner_cpu.group.reposition(
    outer_cpu.localPosition().add(new Vector3(0, 0.1, 0)),
    0
  );
  yield* inner_cpu.clock.scaleTo(new Vector3(0, 0, 0), 0);
  yield* inner_cpu.gpr.scaleTo(new Vector3(0, 0, 0), 0);
  yield* sequence(
    0.3,
    outer_cpu.reposition(new Vector3(0.25, -0.1, -5), 1, easeInQuint),
    inner_cpu.group.scaleTo(new Vector3(1, 1, 1), 0.5, easeOutBack)
  );
  yield* all(
    camera.zoomIn(1.5),
    context_title.node.position([1600, 850], 1),
    context_title.glass().width(700, 1)
  );
  const tag_cu_text = createSignal("Control Unit");
  const tag_iu_text = createSignal("Increment Unit");
  const tag_mc_text = createSignal("Memory Controller");

  const tags = {
    cu: new Label3D({
      text: tag_cu_text,
      color: "control",
      scene,
      worldPosition: inner_cpu.cu.getGlobalPosition().clone(),
      fontSize: 70,
      offset2D: [0, 300],
      width: 500,
    }),

    iu: new Label3D({
      text: tag_iu_text,
      color: "alu",
      scene,
      worldPosition: inner_cpu.iu.getGlobalPosition().clone(),
      fontSize: 70,
      offset2D: [0, 200],
      width: 600,
    }),

    mc: new Label3D({
      text: tag_mc_text,
      color: "memory",
      scene,
      worldPosition: inner_cpu.mc.getGlobalPosition().clone(),
      fontSize: 70,
      offset2D: [0, 330],
      width: 700,
    }),
  };
  const tag_container = <Node x={0} y={-800} />;
  tag_container.add(tags.cu);
  tag_container.add(tags.iu);
  tag_container.add(tags.mc);
  view.add(tag_container);

  const titleText = createSignal("Control Unit (CU)");
  const bulletText = createSignal(
    "- Coordinates everything\n- Tells who acts when\n- Reads instructions"
  );

  const icon_cu = createRef<Icon>();
  const icon_iu = createRef<Icon>();
  const icon_mc = createRef<Icon>();
  const infoside = (
    <Glass width={1400} x={-2800} height={"90%"} key="infoPanel">
      <Icon
        opacity={1}
        ref={icon_cu}
        size={400}
        y={-400}
        icon="lucide:brain"
        zIndex={1}
      />
      <Icon
        opacity={0}
        ref={icon_iu}
        size={400}
        y={-400}
        icon="lucide:plus"
        zIndex={1}
      />
      <Icon
        opacity={0}
        ref={icon_mc}
        size={400}
        y={-400}
        icon="lucide:database"
        zIndex={1}
      />
      <Txt
        fontFamily={"Poppins"}
        fontWeight={700}
        zIndex={1}
        fontSize={100}
        y={0}
        fill={"#fff"}
        text={titleText}
        shadowColor={"#000a"}
        shadowBlur={20}
      />
      <Txt
        shadowColor={"#000a"}
        shadowBlur={20}
        fontSize={80}
        y={250}
        zIndex={1}
        fill={"#ccc"}
        text={bulletText}
      />
    </Glass>
  );
  view.add(infoside);

  // CONTROL UNIT
  yield* waitUntil("cu");
  yield* all(
    tags.cu.popIn(),
    camera.lookTo(inner_cpu.cu.getGlobalPosition(), 1),
    camera.zoomIn(2.2, 1)
  );
  yield* infoside.x(-1400, 0.4, easeOutSine);

  // INCREMENT UNIT
  yield* waitUntil("iu");
  yield* all(
    tag_cu_text("CU", 0.6),
    tags.cu.fontSize(80, 0.6),
    tags.cu.width(200, 0.6),
    tags.iu.popIn(),
    camera.lookTo(inner_cpu.iu.getGlobalPosition()),
    camera.moveRight(0.8, 1),
    camera.zoomIn(1.1),
    titleText("Increment Unit (IU)", 0.6),
    bulletText(
      "- Increments by +1\n- Works on 8-bit numbers\n- Only adds",
      0.5
    ),
    all(icon_cu().opacity(0, 0.4), icon_iu().opacity(1, 0.4))
  );

  // MEMORY CONTROLLER
  yield* waitUntil("mc");
  yield* all(
    tag_iu_text("IU", 0.6),
    tags.iu.fontSize(80, 0.6),
    tags.iu.width(200, 0.6),
    tags.mc.popIn(),
    camera.lookTo(inner_cpu.mc.getGlobalPosition()),
    camera.moveRight(0.8, 1),
    camera.zoomOut(1.1),
    titleText("Memory Controller (MC)", 0.6),
    bulletText(
      "- Reads from RAM\n- Writes back results\n- Sends/receives bytes",
      0.5
    ),
    all(icon_iu().opacity(0, 0.4), icon_mc().opacity(1, 0.4))
  );

  // SHRINK LAST
  yield* waitUntil("mc-exit");
  yield* all(
    tag_mc_text("MC", 0.6),
    tags.mc.fontSize(80, 0.6),
    tags.mc.width(200, 0.6),
    infoside.x(-2800, 1, easeInSine)
  );
  yield* all(
    tag_container.y(-800, 1),
    tags.iu.offset2D([20, 300], 1),
    ...tag_container
      .childrenAs<Label3D>()
      .map((child) =>
        all(
          (child as Label3D).borderModifier(-1, 1),
          (child as Label3D).translucency(1, 1)
        )
      ),
    camera.moveTo(new Vector3(0.5, 5, 1).divideScalar(2), 2),
    camera.lookTo(new Vector3(0.5, -0.7, 0.2).divideScalar(2), 2),
    camera.zoomTo(1.8, 2)
  );
  yield* inner_cpu.wire_mc_ram_address.widthTo(0, 0);
  yield* inner_cpu.wire_mc_ram_data.widthTo(0, 0);

  yield* waitUntil("next");
});
