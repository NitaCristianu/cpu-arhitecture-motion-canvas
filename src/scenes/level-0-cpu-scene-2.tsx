import { Icon, makeScene2D, Node, Rect, Txt } from "@motion-canvas/2d";
import { createScene } from "../components/presets";
import { createInfoCard } from "../utils/infocard";
import { buildCPULevel0, RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import Camera from "../libs/Thrash/Camera";
import { Vector3, MeshPhongMaterial, MeshStandardMaterial } from "three";
import Box from "../libs/Thrash/objects/Box";
import {
  all,
  waitUntil,
  easeOutBack,
  fadeTransition,
  createSignal,
  chain,
  waitFor,
  easeOutCirc,
  easeOutCubic,
  delay,
  easeInCubic,
  easeInOutCirc,
  easeInOutCubic,
  easeInOutSine,
  sequence,
  loop,
  useRandom,
  Color,
  createRef,
} from "@motion-canvas/core";
import { Label3D } from "../components/Label3D";
import { Glass } from "../components/GlassRect";
import COLORS from "../utils/colors";

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(3, 4, 4).divideScalar(3));
  const camera: Camera = scene.findFirst(
    (child) => (child as any) instanceof Camera
  ) as any;

  // === Rebuild base CPU ===
  const inner_cpu = buildCPULevel0(scene);
  yield* inner_cpu.group.rotateTo(new Vector3(-Math.PI / 2, 0, 0), 0);
  yield* inner_cpu.clock.scaleTo(new Vector3(0, 0, 0), 0);
  yield* inner_cpu.gpr.scaleTo(new Vector3(0, 0, 0), 0);

  const phantom_memory = (
    <Box
      localPosition={inner_cpu.iu
        .getGlobalPosition()
        .add(new Vector3(0, 1, -0.1))}
      material={
        new MeshStandardMaterial({
          color: "#ff0000",
          transparent: true,
          opacity: 0,
        })
      }
      localScale={new Vector3(2, 1, 1).multiplyScalar(0.06)}
    />
  ) as Box;
  yield* phantom_memory.opacityTo(0.2, 0);
  scene.add(phantom_memory);

  scene.init();
  view.add(scene);

  // === Title reuse ===
  const context_title = createInfoCard("LEVEL 0 CPU", {
    width: 700,
    props: { top: [1600, 750] },
  });
  view.add(context_title.node);

  const tag_cu_text = createSignal("CU");
  const tag_iu_text = createSignal("IU");
  const tag_mc_text = createSignal("MC");

  const tags = {
    cu: new Label3D({
      text: tag_cu_text,
      color: "control",
      scene,
      worldPosition: () => inner_cpu.cu.getGlobalPosition().clone(),
      fontSize: 70,
      offset2D: [0, 300],
      width: 200,
    }),

    iu: new Label3D({
      text: tag_iu_text,
      color: "alu",
      scene,
      worldPosition: () => inner_cpu.iu.getGlobalPosition().clone(),
      fontSize: 70,
      offset2D: [0, 200],
      width: 200,
    }),

    mc: new Label3D({
      text: tag_mc_text,
      color: "memory",
      scene,
      worldPosition: () => inner_cpu.mc.getGlobalPosition().clone(),
      fontSize: 70,
      offset2D: [0, 330],
      width: 200,
    }),
  };
  const tag_container = <Node x={0} y={-800} />;
  tag_container.add(tags.cu);
  tag_container.add(tags.iu);
  tag_container.add(tags.mc);
  view.add(tag_container);

  // === Match camera state at end of previous scene ===

  yield* all(
    camera.moveTo(new Vector3(0.3, 3.5, 1.46).divideScalar(2), 0),
    camera.lookTo(new Vector3(0.3, -0.7, 0.2).divideScalar(2), 0),
    camera.zoomTo(1.5, 0),
    tags.mc.popIn(0),
    tags.cu.popIn(0),
    tags.iu.popIn(0)
  );

  // === Animate CPU coming back from below ===
  yield* all(inner_cpu.group.scaleTo(new Vector3(1, 1, 1), 0, easeOutBack));
  yield* inner_cpu.ram.scaleTo(RAM_SCALE, 0);
  yield* waitFor(0.5);
  yield* inner_cpu.initWires([
    inner_cpu.wire_cu_iu,
    inner_cpu.wire_iu_mc,
    inner_cpu.wire_mc_ram_data,
    inner_cpu.wire_mc_ram_address,
    inner_cpu.wire_mc_cu,
  ]);

  yield* waitUntil("start");

  yield* all(
    camera.lookTo(new Vector3(0.35, 0, 0.15), 1, easeInOutCubic),
    camera.moveTo(new Vector3(0.35, 1, 0.58), 1),
    camera.zoomIn(1.6, 1, easeInOutCubic)
  );

  const datapoint = () => inner_cpu.wire_mc_ram_data.getMiddlePoint();
  const addresspoint = () => inner_cpu.wire_mc_ram_address.getMiddlePoint();
  const dataBusText = createSignal("Data Bus");
  const addressBusText = createSignal("Address Bus");

  const dataLabel = new Label3D({
    text: dataBusText,
    color: "memory",
    scene,
    worldPosition: datapoint,
    fontSize: 60,
    offset2D: [230, -500],
    width: 500,
  });
  const info_data_buss = (
    <Txt
      y={200}
      fill={"white"}
      zIndex={1}
      text={"Raw values flow here"}
      fontFamily={"Poppins"}
      fontWeight={200}
      scale={0}
    />
  );
  dataLabel.add(info_data_buss);

  const addressLabel = new Label3D({
    text: addressBusText,
    color: "bus",
    scene,
    worldPosition: addresspoint,
    fontSize: 60,
    offset2D: [150, -500],
    width: 500,
  });
  const info_address_buss = (
    <Txt
      y={-200}
      fill={"white"}
      zIndex={1}
      text={"Carries memory locations"}
      fontFamily={"Poppins"}
      fontWeight={200}
      scale={0}
    />
  );
  addressLabel.add(info_address_buss);
  view.add(dataLabel);
  view.add(addressLabel);

  yield* waitUntil("busses");
  yield* chain(dataLabel.popIn(0.5), addressLabel.popIn(0.5));
  yield* waitUntil("address");
  yield* all(
    inner_cpu.wire_mc_ram_address.currentFlow(),
    delay(0.5, info_address_buss.scale(1, 0.5, easeOutCubic))
  );
  yield* waitUntil("data");
  yield* all(
    inner_cpu.wire_mc_ram_data.currentFlow(),
    inner_cpu.wire_mc_ram_data.reverseFlow(),
    delay(0.5, info_data_buss.scale(1, 0.5, easeOutCubic))
  );

  yield* waitUntil("zoom back");
  yield* all(
    camera.moveTo(new Vector3(0.3, 3.5, 1.46).divideScalar(2), 1),
    camera.lookTo(new Vector3(0.3, -0.7, 0.2).divideScalar(2), 1),
    camera.zoomTo(1.5, 1),
    info_address_buss.scale(0, 0.5, easeInCubic),
    info_data_buss.scale(0, 0.5, easeInCubic),
    addressLabel.height(100, 1),
    dataLabel.height(100, 1),
    dataLabel.scale(0.75, 1),
    addressLabel.scale(0.75, 1)
  );
  yield delay(
    1.4,
    all(
      camera.lookTo(
        inner_cpu.cu.getGlobalPosition().add(new Vector3(0.01, 0, 0.05)),
        1.5
      ),
      camera.zoomIn(2, 1.5)
    )
  );
  const clone_address_info = (
    <Label3D
      ignorePosition
      scene={scene}
      worldPosition={null}
      text={"Address info"}
      color={"bus"}
      fontSize={60}
      width={500}
    />
  );
  const clone_data_info = (
    <Label3D
      ignorePosition
      scene={scene}
      worldPosition={null}
      text={"Data info"}
      color={"memory"}
      fontSize={60}
      width={500}
    />
  );
  view.add(clone_address_info);
  view.add(clone_data_info);
  yield all(
    clone_address_info.position(new Vector3(-659, 1124), 0),
    clone_data_info.position(new Vector3(-659, 1124), 0)
  );
  yield* waitFor(0.5);
  yield* inner_cpu.wire_mc_cu.currentFlow(1.5, easeInOutSine, 100);
  yield* all(
    clone_address_info.position(new Vector3(-90, 227), 1),
    clone_address_info.scale(1.3, 1)
  );
  yield* all(
    clone_address_info.position(new Vector3(-90 - 300, 227), 1),
    clone_data_info.position(new Vector3(350, 227), 1),
    clone_data_info.scale(1.3, 1)
  );
  yield* waitUntil("theory");
  yield* all(
    clone_address_info.scale(0, 1),
    clone_data_info.scale(0, 1),
    clone_data_info.position(new Vector3(-9, -164), 1),
    clone_address_info.position(new Vector3(-9, -164), 1),
    camera.zoomOut(1 / 2, 1, easeInOutCubic)
  );
  yield* waitUntil("missing");
  camera.anchor(inner_cpu.base.getGlobalPosition());
  camera.anchorWeight(0.5);
  const r = 0.2;
  const randomgenerator = useRandom(0);
  yield* loop(4, () =>
    camera.lookTo(
      camera
        .anchor()
        .clone()
        .add(
          new Vector3(
            randomgenerator.nextFloat(-r, r),
            0,
            randomgenerator.nextFloat(-r, r)
          )
        ),
      1.5
    )
  );
  yield* waitUntil("memory");
  yield* phantom_memory.moveDOWN(1, 1);

  const memory = new Label3D({
    text: "Memory",
    color: "alu",
    scene,
    worldPosition: phantom_memory.getGlobalPosition(),
    fontSize: 60,
    offset2D: [0, -800],
    width: 500,
  });
  view.add(memory);

  yield* camera.lookTo(phantom_memory.getGlobalPosition(), 1);
  yield* memory.popIn();
  yield* waitUntil("guess");
  yield* camera.zoomIn(1.5, 1);
  yield* waitUntil("reveal");
  yield* all(
    memory.scale(2, 1),
    memory.findFirst((t) => t instanceof Txt).text("a number", 1)
  );
  yield* waitFor(0.5);
  yield* all(
    memory.findFirst((t) => t instanceof Txt).text("a number + an address", 1),
    memory.width(900, 1)
  );

  yield* waitUntil("store");
  yield camera.moveLeft(0.4, 15);
  yield* all(memory.popOut(), camera.zoomIn(1.1, 1));
  yield* waitUntil("area");
  yield* all(phantom_memory.pulse(1.5, 1.5));
  // yield* waitUntil("register space");
  // yield* memory
  //   .findFirst((t) => t instanceof Txt)
  //   .text("register space / GPR", 0),
  //   yield* memory.popIn();
  // const vr_ref = createRef<Glass>();
  // const ar_ref = createRef<Glass>();
  // const register_contents = (
  //   <Glass
  //     size={[1100, 600]}
  //     fill={new Color(COLORS["alu"]).alpha(0.2)}
  //     position={[-15, 37]}
  //     scale={0}
  //     lightness={-0.2}
  //   >
  //     <Txt
  //       zIndex={1}
  //       fontSize={120}
  //       fontWeight={400}
  //       fill={new Color(COLORS["alu"]).brighten(4)}
  //       shadowBlur={10}
  //       shadowColor={"#000a"}
  //       text={"GPR CONTENT"}
  //       fontFamily={"Poppins"}
  //       y={-180}
  //     />
  //     <Rect
  //       width={800}
  //       height={5}
  //       fill={new Color(COLORS["alu"]).brighten(4)}
  //       zIndex={1}
  //       y={-100}
  //       radius={100}
  //     />
  //     <Glass
  //       width={900}
  //       height={130}
  //       zIndex={1}
  //       y={30}
  //       lightness={-0.3}
  //       blurstrength={10}
  //       ref={ar_ref}
  //       scale={0}
  //     >
  //       <Txt
  //         zIndex={1}
  //         fontSize={70}
  //         fontWeight={300}
  //         shadowBlur={10}
  //         fill={new Color(COLORS["alu"]).brighten(5)}
  //         fontFamily={"Poppins"}
  //         shadowColor={"#000a"}
  //         text={"AR: 0x001"}
  //         width={800}
  //       />
  //       <Txt
  //         zIndex={1}
  //         fontSize={70}
  //         fontWeight={200}
  //         fill={"999"}
  //         shadowBlur={10}
  //         fontFamily={"Poppins"}
  //         shadowColor={"#000a"}
  //         text={"8bit"}
  //         width={800}
  //         textAlign={"right"}
  //       />
  //       <Icon
  //         icon={"tabler:lock-filled"}
  //         color={"999"}
  //         scale={0}
  //         size={60}
  //         zIndex={1}
  //         x={230}
  //       />
  //     </Glass>
  //     <Glass
  //       width={900}
  //       height={130}
  //       zIndex={1}
  //       y={200}
  //       lightness={-0.3}
  //       blurstrength={10}
  //       scale={0}
  //       ref={vr_ref}
  //     >
  //       <Txt
  //         zIndex={1}
  //         fontSize={70}
  //         fontWeight={300}
  //         shadowBlur={10}
  //         fontFamily={"Poppins"}
  //         fill={new Color(COLORS["alu"]).brighten(5)}
  //         shadowColor={"#000a"}
  //         text={"VR: 0001 1110"}
  //         width={800}
  //       />
  //       <Txt
  //         zIndex={1}
  //         fontSize={70}
  //         fontWeight={200}
  //         fill={"999"}
  //         shadowBlur={10}
  //         fontFamily={"Poppins"}
  //         shadowColor={"#000a"}
  //         text={"8bit"}
  //         width={800}
  //         textAlign={"right"}
  //       />
  //     </Glass>
  //   </Glass>
  // );
  // view.add(register_contents);

  // yield* waitUntil('contents');
  // yield* all(
  //   register_contents.scale(2,1,easeOutBack),
  //   memory.popOut()
  // )
  // yield* waitUntil('add reg');
  // yield* all(ar_ref().scale(1, 0.33, easeOutBack));
  // yield* waitUntil('val reg');
  // yield* all(vr_ref().scale(1, 0.33, easeOutBack));
  // yield* waitUntil('hardcode');
  // yield* waitFor(0.5);
  // yield* ar_ref()
  //   .findFirst((child) => child instanceof Icon)
  //   .scale(1, 0.3, easeOutBack);
  
  yield* waitUntil("next");
});
