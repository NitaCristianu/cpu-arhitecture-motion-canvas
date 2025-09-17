import { MeshPhysicalMaterial, BoxGeometry, Vector3 } from "three";
import COLORS from "../colors";
import Box from "../../libs/Thrash/objects/Box";
import { connectBus } from "../connectBus";
import Line from "../../libs/Thrash/objects/Line";
import Scene3D from "../../libs/Thrash/Scene";
import { all } from "@motion-canvas/core";
import Mesh from "../../libs/Thrash/objects/Mesh";
import Group from "../../libs/Thrash/objects/Group";

/* ── DIMENSIONS ───────────────────────────────────── */
const T = 0.02; // thin Z-depth for all logic blocks
const S = 0.1; // base XY size of small units
const L = 0.18; // large unit width
const H = 0.13; // large unit height
const wire_sizes = [8, 8, 8, 8, 6, 10, 6, 6, 8, 8, 6, 16, 16];

export function buildCPULevel1(scene: Scene3D, addToScene : boolean = true) {
  const container = new Group({key : "CPU 1 Group"});
  /* ── RAM (tall slab on the right) ─────────────────── */
  const ram = new Box({
    key: "level_1 RAM",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0x07174a }),
    localScale: new Vector3(0, 0, 0), // thin in X, tall in Y
    localPosition: new Vector3(0.5, -0.4, 0),
    localRotation: new Vector3(0, -Math.PI / 2, Math.PI / 2), // slight twist
  });
  /* ── CPU container (rotated flat) ─────────────────── */
  const cpu = new Group({
    key: "Level 1 CPU",
    localScale: new Vector3(0, 0, 0),
    localRotation: new Vector3(-Math.PI / 2, 0, 0), // face “up”
    localPosition: new Vector3(0, -0.35, 0),
  });
  const cpu_base = new Box({
    key: "level_1 BASE",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0x323232 }),
    localScale: new Vector3(0.65, 0.6, T * 5),
    localPosition: new Vector3(-0.02, 0, -0.02 - T * 2),
  });

  /* child blocks — positions are inside cpu-space (XY because we rotated) */
  const cu = new Box({
    key: "level_1 CU",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0x4caf50 }),
    localScale: new Vector3(L / 2, H, T),
    localPosition: new Vector3(-0.18, -0.05, 0),
  });

  const alu = new Box({
    key: "level_1 ALU",
    material: new MeshPhysicalMaterial({
      color: 0x00a0ff,
      metalness: 0.5,
    }),
    localScale: new Vector3(L, H, T),
    localPosition: new Vector3(0.0, -0.05, 0),
  });

  const ir = new Box({
    key: "level_1 IR",
    material: new MeshPhysicalMaterial({
      color: 0x00a0ff,
      metalness: 0.5,
    }),
    localScale: new Vector3(L / 3, L / 3, T),
    localPosition: new Vector3(-0.2, 0.14, 0),
  });

  const mc = new Box({
    key: "level_1 MC",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0xbe22e8 }),
    localScale: new Vector3(L * 0.5, H * 0.8, T),
    localPosition: new Vector3(0.22, -0.05, 0),
  });

  const gpr = new Box({
    key: "level_1 GPR",
    material: new MeshPhysicalMaterial({
      metalness: 1,
      roughness: 2,
      color: 0xcccccc,
    }),
    localScale: new Vector3(S, S * 1.5, T),
    localPosition: new Vector3(0, 0.17, 0),
  });

  const clock = new Box({
    key: "level_1 CLOCK",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0xffffff }),
    localScale: new Vector3(S * 0.3, S * 0.4, T),
    localPosition: new Vector3(-0.3, -0.22, 0),
  });

  const pc = new Box({
    key: "level_1 PC",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0xff0000 }),
    localScale: new Vector3(L * 0.3, L * 0.3, T),
    localPosition: new Vector3(0, -0.22, 0),
  });

  const wire_cu_iu = (
    <Line
      points={[
        cu
          .localPosition()
          .clone()
          .add(new Vector3(cu.localScale().x / 2, 0, 0)),
        cu
          .localPosition()
          .clone()
          .lerp(alu.localPosition(), 0.3)
          .add(new Vector3(0.02, 0.01, 0.005)),

        alu
          .localPosition()
          .clone()
          .add(new Vector3(-alu.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="decoder"
      smooth
      key="level_1 wire_cu_alu"
    />
  ) as Line;

  const wire_iu_mc = (
    <Line
      points={[
        alu
          .localPosition()
          .clone()
          .add(new Vector3(alu.localScale().x / 2, 0, 0)),
        alu
          .localPosition()
          .clone()
          .lerp(mc.localPosition(), 0.4)
          .add(new Vector3(0.015, 0.01, 0.005)),
        mc
          .localPosition()
          .clone()
          .lerp(alu.localPosition(), 0.4)
          .add(new Vector3(-0.015, 0.01, 0.005)),
        mc
          .localPosition()
          .clone()
          .add(new Vector3(-mc.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="control"
      smooth
      key="level_1 wire_iu_mc"
    />
  ) as Line;

  const wire_mc_ram_data = (
    <Line
      points={[
        mc
          .localPosition()
          .clone()
          .add(new Vector3(mc.localScale().x / 2, -0.29, 0.05)),
        mc
          .localPosition()
          .clone()
          .lerp(ram.localPosition(), 0.5)
          .add(new Vector3(-0.05, -0.12, -0.02)),
        ram.localPosition().clone().add(new Vector3(-0.1, 0.05, -0.03)),
      ]}
      lineWidth={0}
      color="memory"
      smooth
      key="level_1 wire_mc_ram_Data"
    />
  ) as Line;

  const wire_mc_ram_address = (
    <Line
      points={[
        mc
          .localPosition()
          .clone()
          .add(new Vector3(mc.localScale().x / 2, -0.29, 0.05)),
        mc
          .localPosition()
          .clone()
          .lerp(ram.localPosition(), 0.5)
          .add(new Vector3(-0.04, -0.12, 0.12)),
        ram.localPosition().clone().add(new Vector3(-0.1, 0.05, 0.1)),
      ]}
      lineWidth={0}
      color="bus"
      smooth
      key="level_1 wire_mc_ram_Adress"
    />
  ) as Line;

  const wire_clock_cu = (
    <Line
      points={[
        clock.localPosition().clone().add(new Vector3(0, 0, 0)),
        clock
          .localPosition()
          .clone()
          .lerp(cu.localPosition(), 0.5)
          .add(new Vector3(-0.06, 0.01, 0.005)),
        cu
          .localPosition()
          .clone()
          .add(new Vector3(0, 0, -cu.localScale().z / 2)),
      ]}
      lineWidth={0}
      color="control"
      smooth
      key="level_1 wire_clock_cu"
    />
  ) as Line;

  const wire_gpr_mc = (
    <Line
      points={[
        gpr
          .localPosition()
          .clone()
          .add(new Vector3(gpr.localScale().x / 2, 0, 0)),
        gpr
          .localPosition()
          .clone()
          .lerp(mc.localPosition(), 0.4)
          .add(new Vector3(-0.02, 0, 0.01)),

        mc
          .localPosition()
          .clone()
          .add(new Vector3(-mc.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="memory"
      smooth
      key="level_1 wire_gpr_mc"
    />
  ) as Line;

  const wire_gpr_iu = (
    <Line
      points={[
        gpr
          .localPosition()
          .clone()
          .add(new Vector3(0, -gpr.localScale().y / 2, 0.01)),
        gpr
          .localPosition()
          .clone()
          .lerp(alu.localPosition(), 0.5)
          .add(new Vector3(0.01, 0, 0.01)),

        alu
          .localPosition()
          .clone()
          .add(new Vector3(0, alu.localScale().y / 2, 0.01)),
      ]}
      lineWidth={0}
      color="register"
      smooth
      key="level_1 wire_gpr_iu"
    />
  ) as Line;

  const wire_cu_pc = (
    <Line
      points={[
        // exit CU on the right
        cu
          .localPosition()
          .clone()
          .add(new Vector3(0, cu.localScale().y / 2 - 0.13, 0)),
        // go above ALU
        cu.localPosition().clone().add(new Vector3(0, -0.15, 0)),

        pc
          .localPosition()
          .clone()
          .add(new Vector3(-pc.localScale().y / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="alu"
      smooth
      key="level_1 wire_cu_pc"
    />
  ) as Line;

  const wire_pc_mc = (
    <Line
      points={[
        // exit PC on the right
        pc
          .localPosition()
          .clone()
          .add(new Vector3(pc.localScale().x / 2, 0, 0)),
        // route along bottom margin
        mc
          .localPosition()
          .clone()
          .add(new Vector3(-mc.localScale().x / 2 - 0.04, -0.16, 0)),
        // enter MC on the left
        mc
          .localPosition()
          .clone()
          .add(new Vector3(0, -mc.localScale().x / 2, 0)),
      ]}
      lineWidth={0}
      color="alu"
      smooth
      key="level_1 wire_pc_mc"
    />
  ) as Line;

  const wire_mc_ir_margin = (
    <Line
      points={[
        // exit MC at the top
        mc
          .localPosition()
          .clone()
          .add(new Vector3(0, mc.localScale().y / 2, 0.01)),
        // hug top-right corner of CPU base, then traverse the top edge
        cpu_base
          .localPosition()
          .clone()
          .add(
            new Vector3(
              cpu_base.localScale().x / 2 - 0.25,
              cpu_base.localScale().y / 2 - 0.02,
              0.06
            )
          ),
        cpu_base
          .localPosition()
          .clone()
          .add(
            new Vector3(
              -cpu_base.localScale().x / 2 + 0.15,
              cpu_base.localScale().y / 2 - 0.09,
              0.07
            )
          ),

        ir
          .localPosition()
          .clone()
          .add(new Vector3(0, ir.localScale().x / 2 - 0.05, 0)),
      ]}
      lineWidth={0}
      color="busData"
      smooth
      key="level_1 wire_mc_ir_margin"
    />
  ) as Line;

  const wire_ir_cu = (
    <Line
      points={[
        // exit IR on the left
        ir
          .localPosition()
          .clone()
          .add(new Vector3(0, -ir.localScale().x / 2 + 0.005, 0)),
        // soft bend toward CU
        ir
          .localPosition()
          .clone()
          .lerp(cu.localPosition(), 0.5)
          .add(new Vector3(-0.02, 0.02, 0.01)),
        // enter CU from the top
        cu
          .localPosition()
          .clone()
          .add(new Vector3(0, cu.localScale().y / 2, 0.01)),
      ]}
      lineWidth={0}
      color="control"
      smooth
      key="level_1 wire_ir_cu"
    />
  ) as Line;

  const wires = {
    wire_cu_iu,
    wire_iu_mc,
    wire_mc_ram_data,
    wire_mc_ram_address,
    wire_clock_cu,
    wire_gpr_mc,
    wire_gpr_iu,
    wire_cu_pc,
    wire_pc_mc,
    wire_mc_ir_margin,
    wire_ir_cu,
  };

  const wiresarray = Object.values(wires);

  [
    pc,
    cu,
    alu,
    ir,
    mc,
    gpr,
    clock,
    cpu_base,
    wire_cu_iu,
    wire_iu_mc,
    wire_clock_cu,
    wire_gpr_mc,
    wire_gpr_iu,
    wire_cu_pc,
    wire_pc_mc,
    wire_mc_ir_margin,
    wire_ir_cu,
  ].forEach((item) => cpu.add(item));
  [wire_mc_ram_data, wire_mc_ram_address, cpu, ram].forEach((item) =>
    container.add(item)
  );
  if (addToScene){
    scene.add(container)
    scene.init();
  }
  /** Convenience API you can call from a scene */
  const api = {
    group: cpu,
    base: cpu_base,
    container,
    ram,
    cu,
    alu,
    mc,
    gpr,
    ir,
    pc,
    clock,
    ...wires,
    wires: wiresarray,
    initWires: function* (
      wires: Line[] = [
        wire_cu_iu,
        wire_iu_mc,
        wire_mc_ram_data,
        wire_mc_ram_address,
        wire_clock_cu,
        wire_gpr_mc,
        wire_gpr_iu,
        wire_cu_pc,
        wire_pc_mc,
        wire_mc_ir_margin,
        wire_ir_cu,
        wire_mc_ram_address,
        wire_mc_ram_data,
      ],
      duration?: number
    ) {
      yield all(
        ...wires.map((wire, i) =>
          wire.widthTo(wire_sizes[i % wire_sizes.length], duration)
        )
      );
      yield all(...wires.map((wire) => wire.popInDraw()));
    },
  };

  return api;
}
