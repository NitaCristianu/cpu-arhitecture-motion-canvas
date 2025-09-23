import { MeshPhysicalMaterial, BoxGeometry, Vector3 } from "three";
import COLORS from "../colors";
import Box from "../../libs/Thrash/objects/Box";
import { connectBus } from "../connectBus";
import Line from "../../libs/Thrash/objects/Line";
import Scene3D from "../../libs/Thrash/Scene";
import { all } from "@motion-canvas/core";
import Mesh from "../../libs/Thrash/objects/Mesh";
import Group from "../../libs/Thrash/objects/Group";
import Sphere from "../../libs/Thrash/objects/Sphere";

/* ── DIMENSIONS ───────────────────────────────────── */
const T = 0.02; // thin Z-depth for all logic blocks
const S = 0.1; // base XY size of small units
const L = 0.18; // large unit width
const H = 0.13; // large unit height
const wire_sizes = [8, 8, 8, 8, 6, 10, 6, 6, 8, 8, 6, 16, 16];

export const FLAG_DEFS = {
  Z: { on: 0x00ff00, off: 0x222222 }, // green
  N: { on: 0xff00ff, off: 0x222222 }, // magenta
  V: { on: 0xffff00, off: 0x222222 }, // yellow
  DZ: { on: 0x00ffff, off: 0x222222 }, // cyan
};

export function buildCPULevel2(scene: Scene3D, addToScene: boolean = true) {
  const container = new Group({ key: "CPU 2 Group" });
  /* ── RAM (tall slab on the right) ─────────────────── */
  const ram = new Box({
    key: "level_2 RAM",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0x07174a }),
    localScale: new Vector3(0, 0, 0), // thin in X, tall in Y
    localPosition: new Vector3(0.5, -0.4, 0),
    localRotation: new Vector3(0, -Math.PI / 2, Math.PI / 2), // slight twist
  });
  /* ── CPU container (rotated flat) ─────────────────── */
  const cpu = new Group({
    key: "Level 2 CPU",
    localScale: new Vector3(0, 0, 0),
    localRotation: new Vector3(-Math.PI / 2, 0, 0), // face “up”
    localPosition: new Vector3(0, -0.35, 0),
  });
  const cpu_base = new Box({
    key: "level_2 BASE",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0x323232 }),
    localScale: new Vector3(0.65, 0.6, T * 5),
    localPosition: new Vector3(-0.02, 0, -0.02 - T * 2),
  });

  /* child blocks — positions are inside cpu-space (XY because we rotated) */
  const cu = new Box({
    key: "level_2 CU",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0x4caf50 }),
    localScale: new Vector3(L / 2, H, T),
    localPosition: new Vector3(-0.18, -0.05, 0),
  });

  const alu = new Box({
    key: "level_2 ALU",
    material: new MeshPhysicalMaterial({
      color: 0x00a0ff,
      metalness: 0.5,
    }),
    localScale: new Vector3(L, H, T),
    localPosition: new Vector3(0.0, -0.05, 0),
  });

  const ir = new Box({
    key: "level_2 IR",
    material: new MeshPhysicalMaterial({
      color: 0x00a0ff,
      metalness: 0.5,
    }),
    localScale: new Vector3(L / 3, L / 3, T),
    localPosition: new Vector3(-0.25, 0.23, 0),
  });

  const mc = new Box({
    key: "level_2 MC",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0xbe22e8 }),
    localScale: new Vector3(L * 0.5, H * 0.8, T),
    localPosition: new Vector3(0.22, -0.05, 0),
  });

  const gpr = new Box({
    key: "level_2 GPR",
    material: new MeshPhysicalMaterial({
      metalness: 1,
      roughness: 2,
      color: 0xcccccc,
    }),
    localScale: new Vector3(S, S * 1.5, T),
    localPosition: new Vector3(0, 0.17, 0),
  });

  const clock = new Box({
    key: "level_2 CLOCK",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0xffffff }),
    localScale: new Vector3(S * 0.3, S * 0.4, T),
    localPosition: new Vector3(-0.3, -0.22, 0),
  });

  const pc = new Box({
    key: "level_2 PC",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0xff0000 }),
    localScale: new Vector3(L * 0.3, L * 0.3, T),
    localPosition: new Vector3(0, -0.22, 0),
  });

  const decode = new Box({
    key: "level_2 DECODE",
    material: new MeshPhysicalMaterial({
      metalness: 0.5,
      color: 0xff9800, // orange for distinction
    }),
    localScale: new Vector3(L / 2, L / 3, T),
    localPosition: new Vector3(-0.15, 0.13, 0), // near IR, left-center
  });

  const alu_flags = new Group({
    key: "level_2 FLAGS",
    localScale: new Vector3(1, 1, 1),
    localPosition: alu
      .localPosition()
      .clone()
      .add(new Vector3(0, -0.05, 0.012)),
  });

  // Individual flag lights (Z, N, V, DZ) — smaller & brighter
  const flag_Z = new Sphere({
    key: "level 2FLAG_Z",
    material: new MeshPhysicalMaterial({
      color: FLAG_DEFS.Z.off,
      metalness: 1,
      roughness: 0,
      emissive: FLAG_DEFS.Z.off,
    }),
    localScale: new Vector3(S * 0.12, S * 0.12, T * 0.6).multiplyScalar(0.5),
    localPosition: new Vector3(-0.03, 0, 0),
  });

  const flag_N = new Sphere({
    key: "level 2 FLAG_N",
    material: new MeshPhysicalMaterial({
      color: FLAG_DEFS.N.off,
      metalness: 1,
      roughness: 0,
      emissive: FLAG_DEFS.N.off,
    }),
    localScale: new Vector3(S * 0.12, S * 0.12, T * 0.6).multiplyScalar(0.5),
    localPosition: new Vector3(-0.01, 0, 0),
  });

  const flag_V = new Sphere({
    key: "level 2 FLAG_V",
    material: new MeshPhysicalMaterial({
      color: FLAG_DEFS.V.off,
      metalness: 1,
      roughness: 0,
      emissive: FLAG_DEFS.V.off,
    }),
    localScale: new Vector3(S * 0.12, S * 0.12, T * 0.6).multiplyScalar(0.5),
    localPosition: new Vector3(0.01, 0, 0),
  });

  const flag_DZ = new Sphere({
    key: "level 2 FLAG_DZ",
    material: new MeshPhysicalMaterial({
      color: FLAG_DEFS.DZ.off,
      metalness: 1,
      roughness: 0,
      emissive: FLAG_DEFS.DZ.off,
    }),
    localScale: new Vector3(S * 0.12, S * 0.12, T * 0.6).multiplyScalar(0.5),
    localPosition: new Vector3(0.03, 0, 0),
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
      key="level_2 wire_cu_alu"
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
      key="level_2 wire_iu_mc"
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
      key="level_2 wire_mc_ram_Data"
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
      key="level_2 wire_mc_ram_Adress"
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
      key="level_2 wire_clock_cu"
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
      key="level_2 wire_gpr_mc"
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
      key="level_2 wire_gpr_iu"
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
      key="level_2 wire_cu_pc"
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
      key="level_2 wire_pc_mc"
    />
  ) as Line;

  const wire_mc_ir = (
    <Line
      points={[
        // exit MC at the top
        mc
          .localPosition()
          .clone()
          .add(new Vector3(0, mc.localScale().y / 2, 0)),
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
          .add(new Vector3(0, ir.localScale().x / 2, -0.02)),
      ]}
      lineWidth={0}
      color="busData"
      smooth
      key="level_2 wire_mc_ir"
    />
  ) as Line;

  const wire_ir_decode = (
    <Line
      points={[
        ir
          .localPosition()
          .clone()
          .add(new Vector3(0, -ir.localScale().y / 2, 0)),
        ir
          .localPosition()
          .clone()
          .lerp(decode.localPosition(), 0.5)
          .add(new Vector3(-0.04, -0.06, 0)),
        decode
          .localPosition()
          .clone()
          .add(new Vector3(-decode.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="busData"
      smooth
      key="level_2 wire_ir_decode"
    />
  ) as Line;

  const wire_decode_cu = (
    <Line
      points={[
        decode.localPosition().clone().add(new Vector3(0, 0, 0)),
        decode
          .localPosition()
          .clone()
          .lerp(cu.localPosition(), 0.5)
          .add(new Vector3(0.02, 0.01, 0.01)),
        cu
          .localPosition()
          .clone()
          .add(new Vector3(0, cu.localScale().y / 2, 0.01)),
      ]}
      lineWidth={0}
      color="control"
      smooth
      key="level_2 wire_decode_cu"
    />
  ) as Line;

  const wire_decode_gpr = (
    <Line
      points={[
        // exit decode on bottom edge (closest to gpr)
        decode
          .localPosition()
          .clone()
          .add(new Vector3(0, -decode.localScale().y / 2, 0)),
        decode
          .localPosition()
          .clone()
          .lerp(gpr.localPosition(), 0.5)
          .add(new Vector3(0, 0, 0.01)),
        // enter gpr on top edge (closest to decode)
        gpr
          .localPosition()
          .clone()
          .add(new Vector3(0, gpr.localScale().y / 2, -0.04)),
      ]}
      lineWidth={0}
      color="control"
      smooth
      key="level_2 wire_decode_gpr"
    />
  ) as Line;

  [flag_Z, flag_N, flag_V, flag_DZ].forEach((f) => alu_flags.add(f));

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
    wire_mc_ir,
    wire_decode_cu,
    wire_ir_decode,
    wire_decode_gpr,
  };

  const wires_array = Object.values(wires);

  [
    pc,
    cu,
    alu,
    ir,
    mc,
    gpr,
    clock,
    decode,
    cpu_base,
    wire_cu_iu,
    wire_iu_mc,
    wire_clock_cu,
    wire_gpr_mc,
    wire_gpr_iu,
    wire_cu_pc,
    wire_pc_mc,
    wire_mc_ir,
    wire_decode_gpr,
    wire_decode_cu,
    wire_ir_decode,
    alu_flags,
  ].forEach((item) => cpu.add(item));

  [wire_mc_ram_data, wire_mc_ram_address, cpu, ram].forEach((item) =>
    container.add(item)
  );
  if (addToScene) {
    scene.add(container);
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
    decode,
    ...wires,
    wires: wires_array,
    initWires: function* (
      wires: Line[] = wires_array,
      duration?: number
    ) {
      yield all(
        ...wires.map((wire, i) =>
          wire.widthTo(wire_sizes[i % wire_sizes.length], duration)
        )
      );
      yield all(...wires.map((wire) => wire.popInDraw()));
    },

    flags: {
      Z: flag_Z,
      N: flag_N,
      V: flag_V,
      DZ: flag_DZ,
      defs: FLAG_DEFS, // <-- keep the ON/OFF colors here

      *set(flag: "Z" | "N" | "V" | "DZ", duration = 0.3) {
        const target = this[flag];
        yield target.pulse(1.2);
        yield* all(target.glowTo(this.defs[flag].on, duration));
      },
      *clear(flag: "Z" | "N" | "V" | "DZ", duration = 0.3) {
        const target = this[flag];
        yield target.pulse(1/1.2);
        yield* target.glowTo(this.defs[flag].off, duration);
      },
      *clearAll(duration = 0.3) {
        yield all(
          this.Z.pulse(1.2),
          this.N.pulse(1.2),
          this.V.pulse(1.2),
          this.DZ.pulse(1.2)
        );
        yield all(
          this.Z.glowTo(this.defs.Z.off, duration),
          this.N.glowTo(this.defs.N.off, duration),
          this.V.glowTo(this.defs.V.off, duration),
          this.DZ.glowTo(this.defs.DZ.off, duration)
        );
      },
    },
  };

  return api;
}
