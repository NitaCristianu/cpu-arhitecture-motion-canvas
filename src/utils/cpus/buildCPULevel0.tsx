import { MeshPhysicalMaterial, BoxGeometry, Vector3 } from "three";
import COLORS from "../colors";
import Box from "../../libs/Thrash/objects/Box";
import { connectBus } from "../connectBus";
import Line from "../../libs/Thrash/objects/Line";
import Scene3D from "../../libs/Thrash/Scene";
import { all, useLogger } from "@motion-canvas/core";
import Mesh from "../../libs/Thrash/objects/Mesh";
import Group from "../../libs/Thrash/objects/Group";

/* ── DIMENSIONS ───────────────────────────────────── */
const T = 0.02; // thin Z-depth for all logic blocks
const S = 0.1; // base XY size of small units
const L = 0.18; // large unit width
const H = 0.13; // large unit height
const wire_sizes = [4, 4, 16, 16, 6, 6, 10, 6, 5];

export const RAM_SCALE = new Vector3(0.2, 0.6, 0.25);

export function buildCPULevel0(scene: Scene3D, addToScene: boolean = true) {
  const container = new Group({key : "CPU 0 Group"});
  /* ── RAM (tall slab on the right) ─────────────────── */
  const ram = new Box({
    key: "RAM",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0x07174a }),
    localScale: new Vector3(0, 0, 0), // thin in X, tall in Y
    localPosition: new Vector3(0.5, -0.4, 0),
    localRotation: new Vector3(0, -Math.PI / 2, Math.PI / 2), // slight twist
  });
  /* ── CPU container (rotated flat) ─────────────────── */
  const cpu = new Group({
    key: "Level 0 CPU",
    localScale: new Vector3(0, 0, 0),
    localRotation: new Vector3(-Math.PI / 2, 0, 0), // face “up”
    localPosition: new Vector3(0, -0.35, 0),
  });
  const cpu_base = new Box({
    key: "BASE",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0x323232 }),
    localScale: new Vector3(0.65, 0.6, T * 5),
    localPosition: new Vector3(-0.02, 0, -0.02 - T * 2),
  });

  /* child blocks — positions are inside cpu-space (XY because we rotated) */
  const cu = new Box({
    key: "CU",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0x4caf50 }),
    localScale: new Vector3(L / 2, H, T),
    localPosition: new Vector3(-0.18, -0.05, 0),
  });

  const iu = new Box({
    key: "IU",
    material: new MeshPhysicalMaterial({
      color: 0xffa000,
      metalness: 0.5,
    }),
    localScale: new Vector3(L, H * 2, T),
    localPosition: new Vector3(0.0, -0.1, 0),
  });

  const mc = new Box({
    key: "MC",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0xbe22e8 }),
    localScale: new Vector3(L * 0.5, H * 0.8, T),
    localPosition: new Vector3(0.22, -0.05, 0),
  });

  const gpr = new Box({
    key: "GPR",
    material: new MeshPhysicalMaterial({
      metalness: 1,
      roughness: 2,
      color: 0xcccccc,
    }),
    localScale: new Vector3(S, S * 1.5, T),
    localPosition: new Vector3(0, 0.17, 0),
  });

  const clock = new Box({
    key: "CLOCK",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0xffffff }),
    localScale: new Vector3(S * 0.3, S * 0.4, T),
    localPosition: new Vector3(-0.3, -0.22, 0),
    children: [
      new Box({
        material: new MeshPhysicalMaterial({
          metalness: 0.5,
          color: 0x0000ff,
        }),
        localScale: new Vector3(0.5, 0.5, 2.2),
      }),
    ],
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
          .lerp(iu.localPosition(), 0.3)
          .add(new Vector3(0.02, 0.01, 0.005)),
        iu
          .localPosition()
          .clone()
          .lerp(cu.localPosition(), 0.3)
          .add(new Vector3(-0.06, 0.01, 0.005)),
        iu
          .localPosition()
          .clone()
          .add(new Vector3(-iu.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="alu"
      smooth
      key="wire_cu_iu"
    />
  ) as Line;

  const wire_iu_mc = (
    <Line
      points={[
        iu
          .localPosition()
          .clone()
          .add(new Vector3(iu.localScale().x / 2, 0, 0)),
        iu
          .localPosition()
          .clone()
          .lerp(mc.localPosition(), 0.4)
          .add(new Vector3(0.015, 0.01, 0.005)),
        mc
          .localPosition()
          .clone()
          .lerp(iu.localPosition(), 0.4)
          .add(new Vector3(-0.015, 0.01, 0.005)),
        mc
          .localPosition()
          .clone()
          .add(new Vector3(-mc.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="alu"
      smooth
      key="wire_iu_mc"
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
      key="wire_mc_ram_Data"
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
      key="wire_mc_ram_Adress"
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
      key="wire_clock_cu"
    />
  ) as Line;

  const wire_cu_gpr = (
    <Line
      points={[
        cu
          .localPosition()
          .clone()
          .add(new Vector3(0, cu.localScale().y / 2, 0.01)),
        cu
          .localPosition()
          .clone()
          .lerp(gpr.localPosition(), 0.5)
          .add(new Vector3(-0.05, 0.12, 0.01)),
        gpr
          .localPosition()
          .clone()
          .add(new Vector3(-gpr.localScale().x / 2, 0, 0.01)),
      ]}
      lineWidth={0}
      color="register"
      smooth
      key="wire_cu_gpr"
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
          .add(new Vector3(0.03, -0.05, 0.01)),
        mc
          .localPosition()
          .clone()
          .lerp(gpr.localPosition(), 0.3)
          .add(new Vector3(-0.04, -0.02, 0.01)),
        mc
          .localPosition()
          .clone()
          .add(new Vector3(-mc.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="memory"
      smooth
      key="wire_gpr_mc"
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
          .lerp(iu.localPosition(), 0.4)
          .add(new Vector3(0.02, 0, 0.01)),

        iu
          .localPosition()
          .clone()
          .add(new Vector3(0, iu.localScale().y / 2, 0.01)),
      ]}
      lineWidth={0}
      color="register"
      smooth
      key="wire_gpr_iu"
    />
  ) as Line;

  const wire_mc_cu = (
    <Line
      points={[
        // 1. Start at left side of mc
        mc
          .localPosition()
          .clone()
          .add(new Vector3(-mc.localScale().x / 2, 0, 0)),

        // 2. Dip down left of IU
        mc.localPosition().clone().add(new Vector3(-0.01, -0.1, 0.01)),

        // 3. Drop below IU
        mc
          .localPosition()
          .clone()
          .lerp(cu.localPosition(), 0.5)
          .add(new Vector3(0, -0.24, 0.01)),

        // 4. Rise up right of IU
        cu.localPosition().clone().add(new Vector3(-0.01, -0.1, 0.01)),

        // 5. End at right side of CU
        cu
          .localPosition()
          .clone()
          .add(new Vector3(cu.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="alu"
      smooth
      key="wire_mc_cu"
    />
  ) as Line;

  const wires = {
    wire_cu_iu,
    wire_iu_mc,
    wire_mc_ram_data,
    wire_mc_ram_address,
    wire_clock_cu,
    wire_cu_gpr,
    wire_gpr_mc,
    wire_gpr_iu,
    wire_mc_cu,
  };
  const wiresarray = Object.values(wires);

  [
    cu,
    iu,
    mc,
    gpr,
    clock,
    cpu_base,
    wire_cu_iu,
    wire_iu_mc,
    wire_clock_cu,
    wire_cu_gpr,
    wire_gpr_mc,
    wire_gpr_iu,
    wire_mc_cu,
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
    iu,
    mc,
    gpr,
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
        wire_cu_gpr,
        wire_gpr_mc,
        wire_gpr_iu,
        wire_mc_cu,
      ]
    ) {
      yield all(...wires.map((wire, i) => wire.widthTo(wire_sizes[i])));
      yield all(...wires.map((wire) => wire.popInDraw()));
    },
    hideWires: function* (
      wires: Line[] = [
        wire_cu_iu,
        wire_iu_mc,
        wire_mc_ram_data,
        wire_mc_ram_address,
        wire_clock_cu,
        wire_cu_gpr,
        wire_gpr_mc,
        wire_gpr_iu,
        wire_mc_cu,
      ]
    ) {
      // useLogger().info(`${wires.length}`)
      yield all(
        ...wires.map((wire) =>
          wire.updatePoints(
            wire._points.map((item) => item.add(new Vector3(0, -0.8, 0)))
          )
        )
      );
    },
  };

  return api;
}
