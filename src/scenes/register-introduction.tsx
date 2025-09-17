import { Icon, makeScene2D, Node, Ray, Rect, Txt } from "@motion-canvas/2d";
import { createScene } from "../components/presets";
import Camera from "../libs/Thrash/Camera";
import {
  all,
  any,
  chain,
  Color,
  createRef,
  createSignal,
  delay,
  easeInBounce,
  easeInCubic,
  easeInOutCubic,
  easeInOutExpo,
  easeInSine,
  easeOutBack,
  easeOutCubic,
  easeOutSine,
  range,
  sequence,
  tween,
  Vector2,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import {
  Line,
  MeshDepthMaterial,
  MeshMatcapMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  MeshToonMaterial,
  Vector3,
} from "three";
import { buildCPULevel0 } from "../utils/cpus/buildCPULevel0";
import Box from "../libs/Thrash/objects/Box";
import { Label3D } from "../components/Label3D";
import { createInfoCard } from "../utils/infocard";
import { Glass } from "../components/GlassRect";
import { addTowerSpotlight } from "../libs/Thrash/components/showlight";
import COLORS from "../utils/colors";
import Model from "../libs/Thrash/objects/Model";

/**
 *
 * FOR ANDREI in future:
 * Remember wires are already height adjustable, search in code.
 * GPR height is adjustable altough the cpu is the one that mostly moves
 *
 */

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(3, 4, 4).divideScalar(3));
  const camera: Camera = scene.findFirst(
    (child) => (child as any) instanceof Camera
  ) as any;

  const getCPUScale = (level: number) =>
    new Vector3(3 + level * 0.1, 1, 3 + level * 0.1).multiplyScalar(0.15); // level 0-4
  const other_cpus = range(5).map((level) => (
    <Box
      localScale={new Vector3(0, 0, 0)}
      localPosition={new Vector3((level + 1) * 1.5, 0, 0.16)}
      material={
        new MeshPhysicalMaterial({
          transmission: 0.9, // glassy transparency
          thickness: 1, // depth effect
          roughness: 0.2, // hazy surface
          metalness: 2.1,
          clearcoat: 1.0,
          clearcoatRoughness: 0.5,
          emissive: "#ff1a1aff", // subtle glow
          emissiveIntensity: 6,
        })
      }
    />
  )) as Box[];
  other_cpus.forEach((cpu) => scene.add(cpu));
  const gpr = new Box({
    key: "GPR Presentation",
    material: new MeshPhysicalMaterial({ color: 0xcccccc }),
    //     localScale: new Vector3(.1, .1 * 1.5, .02),
    localScale: new Vector3(),
    localPosition: new Vector3(0, -2, 0),
  }) as Box;
  const cpu = buildCPULevel0(scene);
  scene.add(cpu);
  yield* cpu.gpr.opacityTo(0.2, 0);
  yield* cpu.clock.scaleTo(new Vector3(), 0);
  yield* cpu.gpr.scaleTo(
    new Vector3(0.1, 0.1 * 1.5, 0.02).divideScalar(1.2),
    0
  );
  yield* all(
    ...[cpu.group, cpu.ram].map((item) =>
      item.reposition(
        item.localPosition().clone().add(new Vector3(0, -1, 0)),
        0
      )
    )
  );

  const lights_api = addTowerSpotlight(scene);

  const cursor = (
    <Model
      key="cursor"
      src="/models/cursor.glb"
      localRotation={new Vector3(-0.4, 0.3, 0.7)}
      localScale={new Vector3(1, 1, 1).multiplyScalar(0.05)}
      localPosition={cpu.clock
        .getGlobalPosition()
        .clone()
        .add(new Vector3(-0.35, 2.49, 0.34))}
    />
  ) as Model;
  scene.add(gpr);
  scene.add(cursor);

  scene.init();
  view.add(scene);
  const context_title = createInfoCard("General Purpose Register (GPR)", {
    props: { top: [0, -view.size().y / 2 - 250] },
    width: 1900,
  });
  view.add(context_title.node);

  yield* camera.zoomTo(3, 0);
  yield* waitFor(1);
  yield* all(
    lights_api.fadeIn(),
    camera.lookTo(new Vector3(0, -0.3, 0), 0.5),
    gpr.reposition(new Vector3(0, -0.3, 0), 0.5, easeOutCubic),
    gpr.popIn(0.5, new Vector3(0.1, 0.1 * 1.5, 0.02)),
    context_title.node.y(context_title.node.y() + 350, 1)
  );
  yield* gpr.startIdleRotation(["y", "z", "x"], 8);
  yield* waitUntil("introduce cpu");

  yield* all(
    gpr.reposition(new Vector3(0, -0.009, 0), 0.5, easeOutCubic),
    camera.lookTo(new Vector3(0, 0, 0), 0.5, easeOutCubic)
  );
  yield* any(
    gpr.rotateTo(new Vector3(Math.PI / 2, 0, 0), 1),
    delay(1, gpr.rotateTo(new Vector3(Math.PI / 2, 0, 0), 81)),
    ...[cpu.group, cpu.ram].map((item) =>
      item.reposition(
        item.localPosition().clone().add(new Vector3(0, 1.2, 0.21)),
        1,
        easeOutCubic
      )
    ),
    cpu.group.popIn()
  );
  yield delay(0.6, lights_api.fadeOut(1.2));
  yield* any(
    cpu.gpr.scaleTo(
      new Vector3(0.1, 0.1 * 1.5, 0.02).divideScalar(1.1),
      0.6,
      easeOutCubic
    ),
    ...[cpu.group, cpu.ram].map((item) =>
      item.reposition(
        item.localPosition().clone().add(new Vector3(0, 0.395, 0)),
        1,
        easeOutCubic
      )
    )
  );
  yield* cpu.wire_cu_gpr.updatePoints(
    cpu.wire_cu_gpr._points.map((item) => item.add(new Vector3(0, 0, 0.0)))
  );
  yield* cpu.wire_mc_ram_address.updatePoints(
    cpu.wire_mc_ram_address._points.map((item) =>
      item.add(new Vector3(-0.005, 0.335, 0.16))
    )
  );
  yield* cpu.wire_mc_ram_data.updatePoints(
    cpu.wire_mc_ram_data._points.map((item) =>
      item.add(new Vector3(-0.005, 0.335, 0.16))
    )
  );

  const tag_cu_text = createSignal("Control Unit");
  const tag_iu_text = createSignal("Increment Unit");
  const tag_mc_text = createSignal("Memory Controller");
  const dataBusText = createSignal("Data Bus");
  const addressBusText = createSignal("Address Bus");
  const tag_ramText = createSignal("VALUE : 27\n( 0001 1011 )");
  const tags = {
    cu: new Label3D({
      text: tag_cu_text,
      color: "control",
      scene,
      worldPosition: cpu.cu.getGlobalPosition().clone(),
      fontSize: 70,
      offset2D: [150, 400],
      width: 500,
      key: "cu-text",
    }),

    iu: new Label3D({
      text: tag_iu_text,
      color: "alu",
      key: "iu-text",
      scene,
      worldPosition: cpu.iu.getGlobalPosition().clone(),
      fontSize: 70,
      offset2D: [200, 400],
      width: 600,
    }),

    mc: new Label3D({
      text: tag_mc_text,
      key: "mc-text",
      color: "memory",
      scene,
      worldPosition: cpu.mc.getGlobalPosition().clone(),
      fontSize: 50,
      offset2D: [200, 430],
      width: 500,
      height: 90,
    }),

    gpr: new Label3D({
      text: "General Purpose Registers",
      key: "gpr-text",
      color: "memory",
      scene,
      worldPosition: cpu.gpr.getGlobalPosition().clone(),
      fontSize: 70,
      offset2D: [0, 330],
      width: 1000,
    }),

    databus: new Label3D({
      text: dataBusText,
      color: "memory",
      scene,
      worldPosition: cpu.wire_mc_ram_data.getMiddlePoint().clone(),
      fontSize: 40,
      offset2D: [400, 450],
      width: 300,
      height: 100,
    }),

    addressbus: new Label3D({
      text: addressBusText,
      color: "bus",
      scene,
      worldPosition: cpu.wire_mc_ram_address.getMiddlePoint().clone(),
      fontSize: 40,
      offset2D: [400, 450],
      width: 300,
      height: 100,
    }),

    ram: new Label3D({
      text: tag_ramText,
      worldPosition: cpu.ram.getGlobalPosition().clone(),
      scene,
      fontSize: 60,
      color: "control",
      offset2D: [400, -600],
      width: 400,
      height: 400,
    }),
  };
  const tag_container = <Node y={-800} />;
  tag_container.add(tags.cu);
  tag_container.add(tags.iu);
  tag_container.add(tags.mc);
  tag_container.add(tags.gpr);
  tag_container.add(tags.databus);
  tag_container.add(tags.addressbus);
  view.add(tags.ram);
  view.add(tag_container);
  const vr_ref = createRef<Glass>();
  const ar_ref = createRef<Glass>();
  const register_contents = (
    <Glass
      size={[1100, 600]}
      fill={new Color(COLORS["memory"]).alpha(0.1)}
      position={[300, -400]}
      scale={0}
      rotation={45}
      skew={[-40, 30]}
      lightness={-0.2}
    >
      <Txt
        zIndex={1}
        fontSize={120}
        fontWeight={400}
        fill={new Color(COLORS["memory"]).brighten(4)}
        shadowBlur={10}
        shadowColor={"#000a"}
        text={"GPR CONTENT"}
        fontFamily={"Poppins"}
        y={-180}
      />
      <Rect
        width={800}
        height={5}
        fill={new Color(COLORS["memory"]).brighten(4)}
        zIndex={1}
        y={-100}
        radius={100}
      />
      <Glass
        width={900}
        height={130}
        zIndex={1}
        y={30}
        lightness={-0.3}
        blurstrength={10}
        ref={ar_ref}
        scale={0}
      >
        <Txt
          zIndex={1}
          fontSize={70}
          fontWeight={300}
          shadowBlur={10}
          fill={new Color(COLORS["memory"]).brighten(5)}
          fontFamily={"Poppins"}
          shadowColor={"#000a"}
          text={"AR: 0x001"}
          width={800}
        />
        <Txt
          zIndex={1}
          fontSize={70}
          fontWeight={200}
          fill={"999"}
          shadowBlur={10}
          fontFamily={"Poppins"}
          shadowColor={"#000a"}
          text={"8bit"}
          width={800}
          textAlign={"right"}
        />
        <Icon
          icon={"tabler:lock-filled"}
          color={"999"}
          scale={0}
          size={60}
          zIndex={1}
          x={230}
        />
      </Glass>
      <Glass
        width={900}
        height={130}
        zIndex={1}
        y={200}
        lightness={-0.3}
        blurstrength={10}
        scale={0}
        ref={vr_ref}
      >
        <Txt
          zIndex={1}
          fontSize={70}
          fontWeight={300}
          shadowBlur={10}
          fontFamily={"Poppins"}
          fill={new Color(COLORS["memory"]).brighten(5)}
          shadowColor={"#000a"}
          text={"VR: 0001 1110"}
          width={800}
        />
        <Txt
          zIndex={1}
          fontSize={70}
          fontWeight={200}
          fill={"999"}
          shadowBlur={10}
          fontFamily={"Poppins"}
          shadowColor={"#000a"}
          text={"8bit"}
          width={800}
          textAlign={"right"}
        />
      </Glass>
    </Glass>
  );
  view.add(register_contents);

  const anchor_notes: Label3D[] = [
    (
      <Label3D
        worldPosition={cpu.wire_mc_cu.getPointAt(0.5)}
        offset2D={[-600, 400]}
        text={"1. The CU tells the MC to read."}
        scene={scene}
        fontSize={50}
        key="cu->mc"
        translucency={0}
        width={780}
        height={80}
        disableShader
        fill={"#000d"}
      />
    ) as Label3D,

    (
      <Label3D
        worldPosition={cpu.mc.getGlobalPosition().clone()}
        offset2D={[400, -700]}
        text={"2. The MC loads the value from memory."}
        scene={scene}
        fontSize={50}
        key="mc->ram"
        translucency={0}
        width={1100}
        height={80}
        disableShader
        fill={"#000d"}
      />
    ) as Label3D,

    (
      <Label3D
        worldPosition={cpu.wire_gpr_mc.getMiddlePoint()}
        offset2D={[430, -220]}
        text={"3. The value is now ready on the data bus."}
        scene={scene}
        textAlign={"center"}
        fontSize={50}
        key="bus-ready"
        translucency={0}
        width={1120}
        height={80}
        disableShader
        fill={"#000d"}
      />
    ) as Label3D,
    (
      <Label3D
        worldPosition={cpu.wire_cu_gpr.getMiddlePoint().clone()}
        offset2D={[100, -250]}
        text={"4. The CU tells the register to load the data."}
        scene={scene}
        fontSize={50}
        key="cu->reg"
        translucency={0}
        width={1150}
        height={80}
        disableShader
        fill={"#000d"}
      />
    ) as Label3D,
    (
      <Label3D
        worldPosition={cpu.wire_cu_gpr.getMiddlePoint().clone()}
        offset2D={[-100, 650]}
        text={"5. The CU tells the IU to increment the value."}
        scene={scene}
        fontSize={50}
        key="cu->iu"
        translucency={0}
        width={1150}
        height={80}
        disableShader
        fill={"#000d"}
      />
    ) as Label3D,

    (
      <Label3D
        worldPosition={cpu.iu.getGlobalPosition().clone()}
        offset2D={[350, -500]}
        text={"6. The Incremental Unit outputs the incremented result."}
        scene={scene}
        fontSize={50}
        key="iu->out"
        translucency={0}
        width={1450}
        height={80}
        disableShader
        fill={"#000d"}
      />
    ) as Label3D,

    (
      <Label3D
        worldPosition={cpu.mc.getGlobalPosition().clone()}
        offset2D={[400, -700]}
        text={"7. The CU orders the MC to write the new value back to memory."}
        scene={scene}
        fontSize={50}
        key="cu->mc-write"
        translucency={0}
        width={1650}
        height={80}
        disableShader
        fill={"#000d"}
      />
    ) as Label3D,

    (
      <Label3D
        worldPosition={cpu.wire_mc_ram_data.getMiddlePoint().clone()}
        offset2D={[300, -350]}
        text={"8. The Memory Controller stores the updated value in RAM."}
        scene={scene}
        fontSize={50}
        key="mc->ram-store"
        translucency={0}
        width={1500}
        height={80}
        disableShader
        fill={"#000d"}
      />
    ) as Label3D,
  ];

  anchor_notes.forEach((note) => view.add(note));

  yield* any(
    camera.moveTo(
      camera.localPosition().clone().add(new Vector3(0, 3, 0.6)),
      2
    ),
    camera.lookTo(gpr.localPosition().clone().add(new Vector3(0, 0, 0.15)), 2),
    cpu.ram.popIn(0.4, new Vector3(0.2, 0.6, 0.25)),
    context_title.node.y(context_title.node.y() - 350, 1)
  );
  yield all(
    ...tag_container
      .children()
      .map((child) => child.scale(1, 0.5, easeOutCubic))
  );
  yield* cpu.initWires([
    cpu.wire_cu_iu,
    cpu.wire_clock_cu,
    cpu.wire_iu_mc,
    cpu.wire_mc_ram_data,
    cpu.wire_mc_ram_address,
    cpu.wire_mc_cu,
    cpu.wire_gpr_iu,
    cpu.wire_gpr_mc,
    cpu.wire_cu_gpr,
  ]);
  yield* cpu.wire_clock_cu.updatePoints(
    cpu.wire_clock_cu._points.map((item) => item.add(new Vector3(0, 0, -0.05)))
  );
  yield* waitUntil("contents");
  yield* any(
    register_contents.scale(0.8, 1, easeOutCubic),
    register_contents.rotation(0, 1, easeOutCubic),
    register_contents.skew([0, 0], 1, easeOutCubic),
    register_contents.position(
      () =>
        scene.projectToScreen(cpu.gpr.getGlobalPosition()).add([1000, -570]),
      2,
      easeOutBack
    )
  );

  yield* cpu.gpr.scaleTo(new Vector3(0, 0, 0), 0);
  yield* waitUntil("ar");
  yield* all(ar_ref().scale(1, 0.33, easeOutBack));
  yield* waitUntil("vr");
  yield* all(vr_ref().scale(1, 0.33, easeOutBack));
  yield* waitUntil("hardcode vr");
  yield* ar_ref()
    .findFirst((child) => child instanceof Icon)
    .scale(1, 0.3, easeOutBack);

  yield* waitUntil("focus");
  yield* all(
    ...tag_container
      .childrenAs<Label3D>()
      .map((item, i) =>
        !(i == 2 || i == 0)
          ? item.scale(0, 0.33, easeInCubic)
          : item.scale(item.scale(), 1)
      )
  );

  camera.anchor(
    cpu.group.getGlobalPosition().clone().add(new Vector3(0, -0.4, -0.1))
  );
  camera.anchorWeight(0.5);

  yield* chain(
    sequence(
      0.7,
      all(
        cpu.cu.expand(),
        tag_container.childrenAs<Label3D>()[0].scale(1.2, 0.33),
        cpu.wire_mc_cu.reverseFlow(1.5, easeInSine, 60),
        camera.lookToWeighted(cpu.cu.getGlobalPosition().clone())
      ),
      all(
        anchor_notes[0].popIn(),
        camera.lookToWeighted(cpu.mc.getGlobalPosition().clone())
      ),
      all(
        cpu.mc.expand(),
        tag_container.childrenAs<Label3D>()[2].scale(1.2, 0.33)
      )
    ),
    all(
      tag_container.childrenAs<Label3D>()[0].scale(1, 0.33),
      tag_container.childrenAs<Label3D>()[2].scale(1, 0.33),
      cpu.mc.shrink(),
      cpu.cu.shrink()
    )
  );
  yield* sequence(
    0.6,
    cpu.wire_mc_ram_data.currentFlow(1),
    all(cpu.wire_mc_ram_data.reverseFlow(1), anchor_notes[1].popIn())
  );
  yield* chain(
    sequence(
      // 1. value travels MC → GPR
      0.6,
      all(
        cpu.wire_gpr_mc.reverseFlow(1.2, easeInSine, 60), // cyan dots forward
        cpu.gpr.expand(), // registers flare
        tag_container.childrenAs<Label3D>()[3].scale(1.1, 0.33), // “VR” label pops
        camera.lookToWeighted(cpu.gpr.getGlobalPosition().clone())
      ),
      all(gpr.expand(), anchor_notes[2].popIn(), anchor_notes[0].popOut())
    ),
    gpr.shrink(),
    sequence(
      0.6,
      all(
        cpu.wire_cu_gpr.currentFlow(1, easeInSine, 50),
        cpu.gpr.shrink(),
        tag_container.childrenAs<Label3D>()[3].scale(1, 0.33),
        anchor_notes[3].popIn(),
        anchor_notes[1].popOut()
      ),

      all(
        vr_ref().childAs<Txt>(0).text("VR: 1001 1011", 1),
        vr_ref().fill("#bbc0f150", 1)
      )
    )
  );
  // yield* camera.lookTo(cpu.group.getGlobalPosition(), 0.4, easeOutCubic);

  yield* waitUntil("cleanup");
  yield* all(
    ...anchor_notes.map((note) => note.popOut()),
    register_contents.scale(0, 0.4, easeInCubic),
    ...tag_container.childrenAs<Label3D>().map((child) => child.popOut())
  );
  yield* all(
    camera.lookToWeighted(
      cpu.cu.getGlobalPosition().clone().sub(new Vector3(0.2, 0, 0)),
      3
    ),
    camera.zoomIn(2, 3)
  );

  yield* waitUntil("clock");
  const clock_oldposition = cpu.clock.getGlobalPosition();
  yield* cpu.clock.moveBack(3, 0);
  const clock_card = createInfoCard("Clock", {
    props: { top: [0, -view.size().y / 2 - 250] },
    width: 400,
  });
  view.add(clock_card.node);
  yield* cpu.wire_clock_cu.widthTo(0, 1);
  yield* all(
    camera.lookToWeighted(
      clock_oldposition.clone().sub(new Vector3(0, 0, 0)),
      2,
      easeInOutCubic,
      0.06
    ),
    cpu.clock.scaleTo(new Vector3(0.03, 0.04, 0.02), 1),
    cpu.clock.moveForward(3, 2)
  );
  yield* all(
    clock_card.node.y(clock_card.node.y() + 350, 1),
    cpu.wire_clock_cu.updatePoints(
      cpu.wire_clock_cu._points.map((item) =>
        item.add(new Vector3(0, 0, 0.05))
      ),
      0
    ),
    cpu.wire_clock_cu.widthTo(8, 1) // width origianlly is 6
  );

  const clock_label = (
    <Label3D
      worldPosition={cpu.wire_clock_cu.getMiddlePoint().clone()}
      offset2D={[-900, 600]}
      text={"The clock tick triggers the CU"}
      scene={scene}
      width={800}
      fontSize={50}
      key="clock->cu"
      translucency={0}
      height={80}
      disableShader
      fill={"#000d"}
    />
  ) as Label3D;
  view.add(clock_label);
  yield* waitUntil("press");
  yield* cursor.moveDOWN(1, 1);
  yield* any(
    cpu.wire_clock_cu.widthTo(6, 1),
    cpu.clock.childAs<Box>(0).moveForward(0.3, 0.5),
    cursor.moveDOWN(0.01, 1)
  );
  yield cpu.wire_clock_cu.currentFlow(1, easeInOutCubic, 100);
  yield clock_label.scale(1, 1);
  yield* all(
    cpu.clock.childAs<Box>(0).moveBack(0.3, 0.5),
    cursor.moveUP(0.01, 0.5)
  );
  yield* waitUntil("resume");
  yield* all(
    camera.lookTo(cpu.base.getGlobalPosition(), 3),
    camera.zoomOut(0.5, 3, easeInOutCubic),
    clock_label.scale(0, 1),
    clock_card.node.y(-3000, 1),
    vr_ref().fill("#0000", 1),
    vr_ref().childAs<Txt>(0).text("VR:0000 0000", 1),
    tags.ram.popIn()
  );

  yield register_contents.scale(1, 1);
  yield register_contents.position([1400, -600], 1);
  yield* all(
    ...tag_container
      .childrenAs<Label3D>()
      .map((item, i) =>
        !(i == 2 || i == 0)
          ? item.scale(0, 0.33, easeInCubic)
          : item.scale(item.scale(), 1)
      )
  );

  yield* chain(
    any(
      waitFor(1),
      chain(
        all(
          cpu.clock.childAs<Box>(0).moveForward(0.3, 0.5),
          cursor.moveDOWN(0.01, 0.3)
        ),
        all(
          cpu.wire_clock_cu.currentFlow(0.5, easeInOutCubic, 50),
          cursor.moveUP(0.01, 0.3),
          cpu.clock.childAs<Box>(0).moveBack(0.3, 0.5)
        )
      )
    ),
    sequence(
      0.7,
      all(
        cpu.cu.expand(),
        tag_container.childrenAs<Label3D>()[0].scale(1.2, 0.33),
        cpu.wire_mc_cu.reverseFlow(1.5, easeInSine, 60),
        camera.lookToWeighted(cpu.cu.getGlobalPosition().clone())
      ),
      all(
        anchor_notes[0].popIn(),
        camera.lookToWeighted(cpu.mc.getGlobalPosition().clone())
      ),
      all(
        cpu.mc.expand(),
        tag_container.childrenAs<Label3D>()[2].scale(1.2, 0.33)
      )
    ),
    waitUntil("tap"),
    any(
      waitFor(1),
      chain(
        all(
          cpu.clock.childAs<Box>(0).moveForward(0.3, 0.5),
          cursor.moveDOWN(0.01, 0.3)
        ),
        all(
          cpu.wire_clock_cu.currentFlow(0.5, easeInOutCubic, 50),
          cursor.moveUP(0.01, 0.3),
          cpu.clock.childAs<Box>(0).moveBack(0.3, 0.5)
        )
      )
    )
  ),
    all(
      tag_container.childrenAs<Label3D>()[0].scale(1, 0.33),
      tag_container.childrenAs<Label3D>()[2].scale(1, 0.33),
      cpu.mc.shrink(),
      cpu.cu.shrink()
    );

  yield* sequence(
    0.6,
    cpu.wire_mc_ram_data.currentFlow(1),
    all(cpu.wire_mc_ram_data.reverseFlow(1), anchor_notes[1].popIn())
  );
  yield* chain(
    any(
      waitFor(0.5),
      chain(
        all(
          cpu.clock.childAs<Box>(0).moveForward(0.3, 0.5),
          cursor.moveDOWN(0.01, 0.3)
        ),
        all(
          cpu.wire_clock_cu.currentFlow(0.5, easeInOutCubic, 50),
          cursor.moveUP(0.01, 0.3),
          cpu.clock.childAs<Box>(0).moveBack(0.3, 0.5)
        )
      )
    ),
    sequence(
      // 1. value travels MC → GPR
      0.6,
      all(
        cpu.wire_gpr_mc.reverseFlow(1.2, easeInSine, 60), // cyan dots forward
        cpu.gpr.expand(), // registers flare
        tag_container.childrenAs<Label3D>()[3].scale(1.1, 0.33), // “VR” label pops
        camera.lookToWeighted(cpu.gpr.getGlobalPosition().clone())
      ),
      all(gpr.expand(), anchor_notes[2].popIn(), anchor_notes[0].popOut())
    ),
    gpr.shrink(),
    any(
      waitFor(0.5),
      chain(
        all(
          cpu.clock.childAs<Box>(0).moveForward(0.3, 0.5),
          cursor.moveDOWN(0.01, 0.3)
        ),
        all(
          cpu.wire_clock_cu.currentFlow(0.5, easeInOutCubic, 50),
          cursor.moveUP(0.01, 0.3),
          cpu.clock.childAs<Box>(0).moveBack(0.3, 0.5)
        )
      )
    ),
    sequence(
      0.6,
      all(
        cpu.wire_cu_gpr.currentFlow(1, easeInSine, 50),
        cpu.gpr.shrink(),
        tag_container.childrenAs<Label3D>()[3].scale(1, 0.33),
        anchor_notes[3].popIn(),
        anchor_notes[1].popOut(),
        anchor_notes[2].popOut()
      ),

      all(
        vr_ref().childAs<Txt>(0).text("VR: 0001 1011", 1),
        vr_ref().fill("#bbc0f150", 1)
      )
    ),

    any(
      waitFor(0.5),
      chain(
        all(
          cpu.clock.childAs<Box>(0).moveForward(0.3, 0.5),
          cursor.moveDOWN(0.01, 0.3)
        ),
        all(
          cpu.wire_clock_cu.currentFlow(0.5, easeInOutCubic, 50),
          cursor.moveUP(0.01, 0.3),
          cpu.clock.childAs<Box>(0).moveBack(0.3, 0.5)
        )
      )
    ),
    sequence(
      // 5. CU tells IU to increment
      0.6,
      all(
        cpu.iu.expand(),
        cpu.wire_cu_iu.currentFlow(1, easeInSine, 50),
        tag_container.childrenAs<Label3D>()[5].scale(1.1, 0.33),
        camera.lookToWeighted(cpu.iu.getGlobalPosition().clone())
      ),
      anchor_notes[4].popIn(),
      anchor_notes[3].popOut()
    ),
    waitFor(0.5),
    sequence(
      // 6. IU outputs the incremented result
      0.6,
      all(
        cpu.iu.shrink(),
        cpu.wire_gpr_iu.reverseFlow(1.2, easeInSine, 60),
        vr_ref().childAs<Txt>(0).text("VR: 0001 1100", 1), // incremented value
        vr_ref().fill("#f8686850", 1),
        anchor_notes[5].popIn(),
        anchor_notes[4].popOut()
      )
    ),
    any(
      waitFor(0.5),
      chain(
        all(
          cpu.clock.childAs<Box>(0).moveForward(0.3, 0.5),
          cursor.moveDOWN(0.01, 0.3)
        ),
        all(
          cpu.wire_clock_cu.currentFlow(0.5, easeInOutCubic, 50),
          cursor.moveUP(0.01, 0.3),
          cpu.clock.childAs<Box>(0).moveBack(0.3, 0.5)
        )
      )
    ),
    sequence(
      // 7. CU orders MC to write back
      0.6,
      all(
        cpu.mc.expand(),
        cpu.wire_mc_cu.reverseFlow(1, easeInSine, 50),
        // tag_container.childrenAs<Label3D>()[6].scale(1.1, 0.33),
        camera.lookToWeighted(cpu.mc.getGlobalPosition().clone())
      ),
      anchor_notes[6].popIn(),
      anchor_notes[5].popOut()
    ),
    waitFor(0.5),
    sequence(
      // 8. MC stores the value in RAM
      0.6,
      all(
        cpu.wire_mc_ram_data.currentFlow(1.2, easeInSine, 60),
        cpu.wire_mc_ram_address.currentFlow(1.2, easeInSine, 60),
        anchor_notes[7].popIn(),
        anchor_notes[6].popOut(),
        cpu.mc.shrink(),
        delay(
          1,
          all(
            tag_ramText("VALUE : 28\n(0001 0100)", 1),
            tags.ram.fill("#eb24e140", 1)
          )
        )
      )
    )
  );

  yield* waitUntil("clean");
  yield* all(
    anchor_notes[7].popOut(),
    tags.cu.popOut(),
    tags.gpr.popOut(),
    tags.mc.popOut(),
    tags.addressbus.popOut(),
    register_contents.scale(0, 1)
  );

  yield* waitUntil("others");
  yield* all(cursor.moveUP(7, 1), camera.moveUP(4, 3));
  const cpus_tags = other_cpus.map((cpu, i) => (
    <Label3D
      text={"Level " + (i + 1) + " CPU"}
      width={0}
      height={0}
      fontSize={80 + (i + 1) * 20}
      scene={scene}
      offset2D={[150, -650]}
      shadowBlur={20}
      shadowColor={"#fff5"}
      worldPosition={cpu.localPosition()}
    />
  )) as Label3D[];
  cpus_tags.forEach((tag) => view.add(tag));

  yield* all(
    camera.moveTo(new Vector3(12, 2, 6), 3, easeInOutExpo),
    camera.lookRight(5.5, 3, easeInOutExpo),
    camera.zoomOut(0.4, 3, easeInOutExpo),
    tags.ram.popOut(),
    delay(
      1,
      sequence(
        1,
        sequence(
          0.2,
          ...other_cpus.map((cpu, i) => cpu.popIn(1, getCPUScale(i)))
        ),
        sequence(0.2, ...cpus_tags.map((tag) => tag.popIn(1)))
      )
    )
  );
  yield* waitUntil("second");
  yield* all(
    camera.moveLeft(9, 2),
    camera.lookTo(other_cpus[0].localPosition(), 2),
    cpus_tags[0].offset2D(
      [150, ((cpus_tags[0].offset2D() as any)[1] as any) - 120],
      2
    ),
    delay(1.4, other_cpus[0].expand(1.5))
  );


  yield* waitUntil("next");
});
