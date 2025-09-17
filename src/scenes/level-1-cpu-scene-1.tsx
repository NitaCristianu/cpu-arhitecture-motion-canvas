import {
  Circle,
  Grid,
  Icon,
  makeScene2D,
  Node,
  Ray,
  Rect,
  Shape,
  Txt,
  View2D,
} from "@motion-canvas/2d";
import { buildCPULevel0, RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { createScene } from "../components/presets";
import {
  all,
  chain,
  clamp,
  createRefArray,
  createSignal,
  delay,
  easeInCubic,
  easeInOutBack,
  easeInOutCubic,
  easeInOutQuad,
  easeOutBack,
  easeOutCirc,
  easeOutCubic,
  loop,
  sequence,
  tween,
  Vector2,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import Camera from "../libs/Thrash/Camera";
import { Line, Spherical, Vector3 } from "three";
import { Label3D } from "../components/Label3D";
import { buildCPULevel1 } from "../utils/cpus/buildCPULevel1";
import { Glass } from "../components/GlassRect";

export default makeScene2D(function* (view: View2D) {
  view.fill("#000");
  // 3D SCENE
  const scene = createScene(new Vector3(-1.5, 1, 1.5));
  const level0_cpu = buildCPULevel0(scene);
  const level1_cpu = buildCPULevel1(scene);

  view.add(scene);
  scene.init();

  // 2D ELEMENTS
  const ram_number_label_count = createSignal(0);
  const ram_number_label = (
    <Label3D
      scene={scene}
      worldPosition={level0_cpu.ram.getGlobalPosition()}
      fontSize={220}
      text={() => ram_number_label_count().toFixed(0)}
      offset2D={[200, -1000]}
      color="bus"
      size={500}
      radius={64}
      translucency={0.2}
    >
      <Txt y={220} fill={"#fffa"} fontFamily={"Poppins"} zIndex={1}>
        0x005
      </Txt>
      <Rect
        x={1000}
        layout
        alignItems={"end"}
        opacity={0}
        scale={0.5}
        direction={"column"}
      >
        <Rect justifyContent={"start"} alignItems={"center"} gap={10}>
          <Icon color={"#fffd"} size={40} icon={"tabler:lock-filled"} />
          <Txt
            fill={"#fffd"}
            fontSize={50}
            zIndex={1}
            text={"0x005 is a fixed location,"}
          />
        </Rect>
        <Txt
          fontFamily={"Poppins"}
          fontSize={50}
          fill={"#fffd"}
          zIndex={1}
          text={" hardcoded in register space"}
        />
      </Rect>
    </Label3D>
  ) as Label3D;
  view.add(ram_number_label);

  // TIMELINE

  const camera: Camera = scene.findFirst(
    (child) => child instanceof Camera
  ) as any;
  yield* camera.lookTo(level0_cpu.base.getGlobalPosition(), 0);
  yield* all(
    level1_cpu.ram.moveRight(2, 0),
    level1_cpu.group.moveRight(2, 0),
    level1_cpu.wire_mc_ram_address.updatePoints(
      level1_cpu.wire_mc_ram_address._points.map((p) =>
        p.add(new Vector3(2, 0, 0))
      )
    ),
    level1_cpu.wire_mc_ram_data.updatePoints(
      level1_cpu.wire_mc_ram_data._points.map((p) =>
        p.add(new Vector3(2, 0, 0))
      )
    )
  );

  yield* waitUntil("begin");
  yield* sequence(
    0.3,
    level0_cpu.group.popIn(1),
    level0_cpu.ram.popIn(1, RAM_SCALE)
  );
  yield* all(
    level0_cpu.wire_mc_ram_address.widthTo(8, 0),
    level0_cpu.wire_mc_ram_data.widthTo(8, 0)
  );
  yield* all(
    level0_cpu.wire_mc_ram_data.popInDraw(),
    level0_cpu.wire_mc_ram_address.popInDraw()
  );

  yield* waitUntil("inspect ram");
  yield* all(
    camera.moveTo(
      level0_cpu.base.getGlobalPosition().add(new Vector3(-1, 0.5, 0)),
      1,
      easeInOutQuad
    ),
    camera.lookTo(level0_cpu.ram.getGlobalPosition(), 1, easeInOutQuad)
  );
  yield* waitUntil("inspect data");
  yield* sequence(
    0.7,
    ram_number_label.popIn(),
    loop(4, (i) =>
      sequence(
        0.31,
        all(
          level0_cpu.wire_mc_ram_address.currentFlow(0.3, easeInCubic, 40),
          level0_cpu.wire_mc_ram_data.currentFlow(0.3, easeInCubic, 40)
        ),
        all(
          ram_number_label.childAs<Txt>(4).scale([1, 0], 0.35),
          ram_number_label.childAs<Txt>(4).y(150, 0.3),
          ram_number_label.childAs<Txt>(4).shadowBlur(140, 0.3),
          ram_number_label.childAs<Txt>(4).shadowColor("#fff", 0)
        ),
        all(
          ram_number_label_count(i + 1, 0),
          ram_number_label.childAs<Txt>(4).y(-150, 0)
        ),
        all(
          ram_number_label.childAs<Txt>(4).shadowBlur(0, 0),
          ram_number_label.childAs<Txt>(4).y(0, 0.3),
          ram_number_label.childAs<Txt>(4).scale([1.5, 1.5], 0.34)
        )
      )
    ),
    all(
      ram_number_label.offset([2.5, 0], 1),
      ram_number_label.childAs<Rect>(1).scale(1.5, 1),
      ram_number_label.childAs<Rect>(1).opacity(1, 1)
    )
  );

  yield* waitUntil("level-1-cpu");
  yield* all(
    camera.lookTo(level1_cpu.base.getGlobalPosition(), 1),
    sequence(
      0.3,
      level1_cpu.group.popIn(0.4),
      level1_cpu.ram.popIn(0.4, RAM_SCALE)
    )
  );
  yield* all(
    camera.moveTo(new Vector3(0.7, 0.2, 0.5), 2),
    camera.zoomOut(1, 1)
  );
  yield* level1_cpu.initWires(
    [
      ...level1_cpu.wires,
      // level1_cpu.wire_mc_ram_address,
      // level1_cpu.wire_mc_ram_data,
    ],
    0
  );
  // yield* all(...[...level1_cpu.wires].map((wire) => wire.popInDraw()));

  // Key features / steps
  // ALU integration
  // ir
  // acc
  // pc
  // clock

  yield* waitUntil('steps');
  const steps = [
    {
      name: "tabler:logic-xor",
      text: false,
    },
    {
      name: "IR",
      text: true,
    },
    {
      name: "ACC",
      text: true,
    },
    {
      name: "PC",
      text: true,
    },
    {
      name: "material-symbols:avg-time-outline-rounded",
      text: false,
    },
  ];
  const elements = createRefArray<Shape>();

  const features = (
    <Rect x={1250} width={1200} y={-200} scale={0.9} height={1600} radius={64}>
      {...steps.map((el, i) => (
        <>
          <Circle
            stroke={"white"}
            lineWidth={15}
            size={300}
            y={(i - 2) * 400 + 200}
            x={(i % 2 == 0 ? -1 : 1) * 150}
            shadowBlur={100}
            shadowColor={"#fffa"}
            scale={0}
            ref={elements}
          >
            {el.text ? (
              <Txt
                text={el.name}
                fill={"white"}
                fontSize={100}
                fontFamily={"Poppins"}
                fontWeight={800}
              />
            ) : (
              <Icon icon={el.name} color={"white"} size={200} />
            )}
            {i != steps.length - 1 ? (
              <Ray
                toY={250}
                toX={((i + 1) % 2 == 0 ? -1 : 1) * 150}
                endArrow
                fromY={150}
                lineWidth={15}
                stroke={"white"}
                end={0}
              />
            ) : null}
            <Txt
              fontFamily={"Poppins"}
              fontWeight={600}
              fontSize={100}
              fill="yellow"
              // text={"STEP 1. MATH"}
              offsetX={-1.7}
            />
          </Circle>
        </>
      ))}
    </Rect>
  );
  features.save();
  features.scale(0);
  features.x(2000);
  view.add(features);

  yield camera.zoomOut(0.7, 1);
  yield delay(0, all(features.restore(1, easeOutCirc)));
  yield delay(
    1,
    sequence(
      0.6,
      ...elements.map((el) =>
        chain(
          el.scale(1, 0.5, easeOutBack),
          (() => {
            const ray = el.findFirst((child) => child instanceof Ray);
            return ray ? ray.end(1, 1, easeOutCubic) : waitFor(0.5);
          })()
        )
      )
    )
  );

  {
    const starting_position = camera.localPosition();
    const target = level1_cpu.group.getGlobalPosition();
    camera.camera().up.set(0, 1, 0); // avoids roll

    const rel = starting_position.sub(target);
    const sph = new Spherical().setFromVector3(rel);
    const radius = sph.radius;
    const theta0 = sph.theta;
    const phi = sph.phi;

    const turns = 1;
    const dTheta = turns * Math.PI * 2;

    yield tween(9, (t) => {
      const eased_t = easeInOutCubic(t);
      const theta = theta0 + dTheta * eased_t;
      const psh = new Spherical(radius + t / 2, phi, theta);
      const position = target.clone().add(new Vector3().setFromSpherical(psh));
      const forward = position
        .clone()
        .sub(starting_position)
        .normalize()
        .multiplyScalar(-1);
      const right = forward.clone().cross(new Vector3(0, 1, 0)).normalize();
      camera.lookAt(target.clone().add(right.multiplyScalar(eased_t / -4)));
      camera.camera().lookAt(camera.lookAt());

      camera.localPosition(position);
      camera.camera().position.copy(position);
    });
  }

  yield* waitUntil("zoom");
  const grid = <Grid stroke={"red"} lineWidth={7} />;
  view.add(grid);

  yield* all(
    scene.opacity(0, 1),
    features.x(0, 1),
    features.scale(3, 1),
    features.position([400, 1800], 1)
  );
  scene.remove();
  yield* waitUntil("alu");
  const color = "rgba(255, 234, 0, 1)";
  yield* all(
    elements[0].stroke(color, 1),
    elements[0].scale(1.1, 1, easeInOutBack),
    elements[0].shadowColor(color, 1),
    elements[0].childAs<Icon>(0).color(color, 1),
    elements[0].childAs<Ray>(1).stroke(color, 1),
  );
  yield* all(
    elements[0].childAs<Txt>(2).text("Step 1. Math", 1),
    features.position([-650, 1800], 1),
  );


  yield* waitUntil("next");
});
