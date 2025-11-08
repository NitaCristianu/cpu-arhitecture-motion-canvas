import { makeScene2D, Txt } from "@motion-canvas/2d";
import {
  all,
  createRef,
  easeInOutCubic,
  sequence,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { Vector3 } from "three";
import { createScene } from "../components/presets";
import Cam from "../libs/Thrash/Camera";
import { buildCPULevel0, RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { buildCPULevel1 } from "../utils/cpus/buildCPULevel1";
import { buildCPULevel2 } from "../utils/cpus/buildCPULevel2";
import { buildCPULevel3 } from "../utils/cpus/buildCPULevel3";

const CPU_BUILDERS = [
  { name: "Level 0", short: "l0", build: buildCPULevel0 },
  { name: "Level 1", short: "l1", build: buildCPULevel1 },
  { name: "Level 2", short: "l2", build: buildCPULevel2 },
  { name: "Level 3", short: "l3", build: buildCPULevel3 },
];

const ANGLE_OFFSETS: Record<string, Vector3> = {
  iso: new Vector3(1.0, 0.65, 1.35),
  front: new Vector3(0, 0.05, 1.4),
  right: new Vector3(1.35, 0.35, 0),
  back: new Vector3(0, 0.05, -1.4),
  top: new Vector3(0, 1.75, 0.05),
};

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(3, 4, 4).divideScalar(3));
  const camera = scene.getCameraClass() as Cam;
  const infoRef = createRef<Txt>();

  const instructions = [
    "Dev Model Inspector",
    "",
    ...CPU_BUILDERS.map(
      ({ name, short }) =>
        `${name}: ${short}, ${short}-iso/front/right/back/top, ${short}-hide`
    ),
  ].join("\n");

  view.add(
    <Txt
      ref={infoRef}
      text={instructions}
      fontSize={38}
      fontFamily="Poppins"
      fill="#eef"
      opacity={0.85}
      position={[-view.size().x / 2 + 260, view.size().y / 2 - 220]}
      lineHeight={46}
      textAlign="left"
    />
  );

  const entries = CPU_BUILDERS.map(({ short, build }) => {
    const cpu = build(scene, false);
    scene.add(cpu.container);
    cpu.group?.localScale(new Vector3(0, 0, 0));
    cpu.ram?.localScale(new Vector3(0, 0, 0));
    return { short, cpu };
  });

  scene.init();
  view.add(scene);

  yield* camera.zoomOut(0.5, 0);

  const focusOf = (cpu: ReturnType<typeof buildCPULevel0>) =>
    cpu.base?.getGlobalPosition().clone() ??
    cpu.group?.getGlobalPosition().clone() ??
    new Vector3();

  function* moveCamera(
    cpu: ReturnType<typeof buildCPULevel0>,
    offsetName: keyof typeof ANGLE_OFFSETS
  ) {
    const target = focusOf(cpu);
    const desired = target.clone().add(ANGLE_OFFSETS[offsetName]);
    yield* all(
      camera.moveTo(desired, 0.8, easeInOutCubic),
      camera.lookTo(target, 0.8, easeInOutCubic)
    );
  }

  function* popInCpu(entry: (typeof entries)[number]) {
    const tasks = [];
    if (entry.cpu.group) {
      tasks.push(entry.cpu.group.popIn(0.6, new Vector3(1, 1, 1)));
    }
    if (entry.cpu.ram) {
      tasks.push(entry.cpu.ram.popIn(0.6, RAM_SCALE.clone()));
    }
    if (tasks.length) {
      yield* all(...tasks);
    }
  }

  function* popOutCpu(entry: (typeof entries)[number]) {
    const tasks = [];
    if (entry.cpu.group) {
      tasks.push(entry.cpu.group.popOut(0.4));
    }
    if (entry.cpu.ram) {
      tasks.push(entry.cpu.ram.popOut(0.4));
    }
    if (tasks.length) {
      yield* all(...tasks);
    }
  }

  function* showCpu(index: number) {
    yield* sequence(
      0,
      ...entries.map((entry, idx) =>
        idx === index ? popInCpu(entry) : popOutCpu(entry)
      )
    );
  }

  function* hideCpu(index: number) {
    yield* popOutCpu(entries[index]);
  }

  const level = 0;
  const { short, cpu } = entries[level];
  yield* waitUntil(short);
  yield* showCpu(level);
  yield* moveCamera(cpu as any, "iso");

  yield* camera.zoomIn(3,1);
  yield* cpu.ram.scaleTo(new Vector3(0,0,0),0);
  yield* cpu.initWires(
    cpu.wires.filter(w => !(w == cpu.wire_mc_ram_address || w == cpu.wire_mc_ram_data))
  );
  yield* all(
    camera.moveTo(
     new Vector3(2, 1, 2),
      2
    ),
    camera.lookTo(
      cpu.gpr.localPosition().clone().add(new Vector3(0, -.45, 0)),
      2
    )
  );
  yield* waitFor(2);

  for (const angle of ["front", "right", "back", "top"] as const) {
    yield* waitFor(1);
    yield* waitUntil(`${short}-${angle}`);
    yield* moveCamera(cpu as any, angle);
  }

  yield* waitUntil(`${short}-hide`);
  yield* hideCpu(level);
});
