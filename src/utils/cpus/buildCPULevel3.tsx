import { MeshPhysicalMaterial, Vector3 } from "three";
import COLORS from "../colors";
import Box from "../../libs/Thrash/objects/Box";
import Line from "../../libs/Thrash/objects/Line";
import Scene3D from "../../libs/Thrash/Scene";
import { all } from "@motion-canvas/core";
import Group from "../../libs/Thrash/objects/Group";
import Sphere from "../../libs/Thrash/objects/Sphere";
import Model from "../../libs/Thrash/objects/Model";

const T = 0.02;
const S = 0.1;
const L = 0.18;
const H = 0.13;
const INSTRUCTION_BUS_WIDTH = 12;
const CHIP_ROTATION = new Vector3(Math.PI / 2, 0, 0);

export const FLAG_DEFS = {
  Z: { on: 0x00ff00, off: 0x222222 },
  N: { on: 0xff00ff, off: 0x222222 },
  V: { on: 0xffff00, off: 0x222222 },
  DZ: { on: 0x00ffff, off: 0x222222 },
} as const;

export function buildCPULevel3(scene: Scene3D, addToScene: boolean = true) {
  const container = new Group({ key: "CPU 3 Group" });

  const ram = new Model({
    key: "level_3 RAM",
    src: "/models/Chips/RAM.glb",
    localScale: new Vector3(0, 0, 0), // thin in X, tall in Y
    localPosition: new Vector3(0.9, -0.35, 0.08),
    localRotation: new Vector3(0, Math.PI, 0),
  });

  const cpu = new Group({
    key: "Level 3 CPU",
    localScale: new Vector3(0, 0, 0),
    localRotation: new Vector3(-Math.PI / 2, 0, 0),
    localPosition: new Vector3(0, -0.35, 0),
  });

  const cpu_base = new Model({
    key: "level_3 BASE",
    src: "/models/Chips/Base.glb",
    localScale: new Vector3(1.12, 0.82, T * 6),
    localPosition: new Vector3(0.04, 0.05, -0.02 - T * 2),
    sceneRotation: CHIP_ROTATION,
  });

  const cu = new Box({
    key: "level_3 CU",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0x4caf50 }),
    localScale: new Vector3(L / 2, H, T),
    localPosition: new Vector3(-0.24, -0.1, 0),
  });

  const alu = new Model({
    key: "level_2 ALU",
    src: "/models/Chips/ALU.glb",
    localScale: new Vector3(L, T * 2, H),
    localRotation: new Vector3(Math.PI / 2, 0, 0),
    localPosition: new Vector3(-0.05, 0.05, 0.01),
  });

  const fpu = new Box({
    key: "level_3 FPU",
    material: new MeshPhysicalMaterial({
      color: COLORS.fpu,
      metalness: 0.7,
      roughness: 0.4,
    }),
    localScale: new Vector3(L, H * 1.1, T),
    localPosition: new Vector3(0.22, 0.05, 0),
  });

  const ir = new Box({
    key: "level_3 IR",
    material: new MeshPhysicalMaterial({
      color: COLORS.bus,
      metalness: 0.6,
    }),
    localScale: new Vector3((L / 3) * 1.3, (L / 3) * 1.3, T),
    localPosition: new Vector3(-0.34, 0.28, 0),
  });

  const decode = new Model({
    key: "level_3 DECODE",
    src: "/models/Chips/DU.glb",
    localScale: new Vector3(L / 2, L / 2, L / 2 / 1.5),
    localPosition: new Vector3(-0.24, 0.15, 0.0),
    sceneRotation: CHIP_ROTATION,
  });

  const mc = new Box({
    key: "level_3 MC",
    material: new MeshPhysicalMaterial({ metalness: 0.5, color: 0xbe22e8 }),
    localScale: new Vector3(L * 0.55, H * 0.85, T),
    localPosition: new Vector3(0.42, -0.12, 0),
  });

  const cache = new Group({
    key: "level_3 CACHE",
    localPosition: new Vector3(0.7, -0.02, 0),
  });

  const cacheBody = new Box({
    key: "level_3 CACHE_BODY",
    material: new MeshPhysicalMaterial({
      metalness: 0.7,
      roughness: 0.4,
      color: COLORS.cache,
    }),
    localScale: new Vector3(S * 1.24, S * 2.4, T),
  });

  const cacheData = new Box({
    key: "level_3 CACHE_DATA",
    material: new MeshPhysicalMaterial({
      metalness: 0.8,
      roughness: 0.3,
      color: COLORS.busData,
      emissive: 0x0c1c40,
    }),
    localScale: new Vector3(S * 0.6, S * 0.85, T * 0.9),
    localPosition: new Vector3(-0.03, 0.12, 0.01),
  });

  const cacheInstr = new Box({
    key: "level_3 CACHE_INSTR",
    material: new MeshPhysicalMaterial({
      metalness: 0.8,
      roughness: 0.3,
      color: COLORS.busAddr,
      emissive: 0x0e162f,
    }),
    localScale: new Vector3(S * 0.6, S * 0.85, T * 0.9),
    localPosition: new Vector3(0.03, -0.12, 0.01),
  });

  cache.add(cacheBody);
  cache.add(cacheData);
  cache.add(cacheInstr);

  const gpr = new Model({
    key: "level_3 GPR",
    src: "/models/Chips/gpr.glb",
    localScale: new Vector3(S, S, S / 1.5),
    localPosition: new Vector3(-0.1, 0.25, 0.025),
    sceneRotation: CHIP_ROTATION,
  });

  const fpr = new Box({
    key: "level_3 FPR",
    material: new MeshPhysicalMaterial({
      metalness: 0.9,
      roughness: 0.3,
      color: 0xa9d6ff,
      emissive: 0x132544,
    }),
    localScale: new Vector3(S * 1.1, S * 2, T),
    localPosition: new Vector3(0.36, 0.32, 0),
  });

  const stackPointers = new Group({
    key: "level_3 STACK",
    localPosition: new Vector3(0.12, 0.38, 0),
  });

  const bp = new Box({
    key: "level_3 BP",
    material: new MeshPhysicalMaterial({
      color: 0x0077c2,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0x001b33,
    }),
    localScale: new Vector3(S * 0.4, S * 0.55, T * 0.9),
    localPosition: new Vector3(-0.08, -0.02, 0),
  });

  const sp = new Box({
    key: "level_3 SP",
    material: new MeshPhysicalMaterial({
      color: 0x009688,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0x00211a,
    }),
    localScale: new Vector3(S * 0.4, S * 0.55, T * 0.9),
    localPosition: new Vector3(0.08, -0.02, 0),
  });

  // const stackLogic = new Box({
  //   key: "level_3 STACK_LOGIC",
  //   material: new MeshPhysicalMaterial({
  //     metalness: 0.6,
  //     roughness: 0.5,
  //     color: COLORS.control,
  //   }),
  //   localScale: new Vector3(S * 0.35, S * 0.35, T * 0.9),
  //   localPosition: new Vector3(0, -0.14, 0),
  // });

  stackPointers.add(bp);
  stackPointers.add(sp);
  // stackPointers.add(stackLogic);

  const clock = new Group({
    key: "level_2 CLOCK",
    localScale: new Vector3(1, 1, 0.8).multiplyScalar(0.08),
    localPosition: new Vector3(-0.3, -0.25, 0.045),
  });

  clock.add(
    new Model({
      key: "level_2 CLOCK_MODEL",
      src: "/models/Chips/NewClock.glb",
      localPosition: new Vector3(0, 0, 0.03),
      localRotation: new Vector3(Math.PI / 2, 0, 0),
    })
  );

  const pc = new Model({
    key: "level_3 PC",
    src: "/models/Chips/PC.glb",
    localScale: new Vector3(L * 0.35, L * 0.35, (L * 0.35) / 1.5),
    localPosition: new Vector3(0.08, -0.28, 0.0),
    sceneRotation: CHIP_ROTATION,
  });

  const alu_flags = new Group({
    key: "level_3 FLAGS",
    localScale: new Vector3(1, 1, 1),
    localPosition: alu
      .localPosition()
      .clone()
      .add(new Vector3(0, -0.05, 0.012)),
  });

  const flag_Z = new Sphere({
    key: "level_3 FLAG_Z",
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
    key: "level_3 FLAG_N",
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
    key: "level_3 FLAG_V",
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
    key: "level_3 FLAG_DZ",
    material: new MeshPhysicalMaterial({
      color: FLAG_DEFS.DZ.off,
      metalness: 1,
      roughness: 0,
      emissive: FLAG_DEFS.DZ.off,
    }),
    localScale: new Vector3(S * 0.12, S * 0.12, T * 0.6).multiplyScalar(0.5),
    localPosition: new Vector3(0.03, 0, 0),
  });

  alu_flags.add(flag_Z);
  alu_flags.add(flag_N);
  alu_flags.add(flag_V);
  alu_flags.add(flag_DZ);

  const wire_cu_alu = (
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
      key="level_3 wire_cu_alu"
    />
  ) as Line;

  const wire_cu_fpu = (
    <Line
      points={[
        cu
          .localPosition()
          .clone()
          .add(new Vector3(cu.localScale().x / 2, -0.01, 0)),
        cu
          .localPosition()
          .clone()
          .lerp(fpu.localPosition(), 0.5)
          .add(new Vector3(0.06, -0.02, 0.006)),
        fpu
          .localPosition()
          .clone()
          .add(new Vector3(-fpu.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="control"
      smooth
      key="level_3 wire_cu_fpu"
    />
  ) as Line;

  const wire_alu_mc = (
    <Line
      points={[
        alu
          .localPosition()
          .clone()
          .add(new Vector3(alu.localScale().x / 2, 0, 0)),
        alu
          .localPosition()
          .clone()
          .lerp(mc.localPosition(), 0.5)
          .add(new Vector3(0.05, -0.02, 0.004)),
        mc
          .localPosition()
          .clone()
          .add(new Vector3(-mc.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="control"
      smooth
      key="level_3 wire_alu_mc"
    />
  ) as Line;

  const wire_fpu_mc = (
    <Line
      points={[
        fpu
          .localPosition()
          .clone()
          .add(new Vector3(fpu.localScale().x / 2, 0, 0)),
        fpu
          .localPosition()
          .clone()
          .lerp(mc.localPosition(), 0.5)
          .add(new Vector3(0.03, 0, 0.006)),
        mc
          .localPosition()
          .clone()
          .add(new Vector3(-mc.localScale().x / 2, -0.02, 0)),
      ]}
      lineWidth={0}
      color="fpu"
      smooth
      key="level_3 wire_fpu_mc"
    />
  ) as Line;

  const wire_mc_cache_address = (
    <Line
      points={[
        mc.localPosition().clone(),
        mc
          .localPosition()
          .clone()
          .lerp(cache.localPosition(), 0.5)
          .add(new Vector3(0.06, -0.04, 0.025)),
        cache
          .localPosition()
          .clone()
          .add(new Vector3(cacheBody.localScale().x / 2 - 0.06, -0.12, 0.02)),
      ]}
      lineWidth={0}
      color="busAddr"
      smooth
      key="level_3 wire_mc_cache_address"
    />
  ) as Line;

  const wire_mc_cache_data = (
    <Line
      points={[
        mc.localPosition().clone().add(new Vector3(0.03, .04, 0)),
        mc
          .localPosition()
          .clone()
          .lerp(cache.localPosition(), 0.5)
          .add(new Vector3(-0.06, 0.1, 0.025)),
        cache
          .localPosition()
          .clone()
          .add(new Vector3(-cacheBody.localScale().x / 2, 0.12, 0.02)),
      ]}
      lineWidth={0}
      color="memory"
      smooth
      key="level_3 wire_mc_cache_data"
    />
  ) as Line;

  const wire_cache_ram_data = (
    <Line
      points={[
        cache
          .localPosition()
          .clone()
          .add(
            new Vector3(
              -cacheBody.localScale().x / 2 + 0.06,
              -0.12,
              -cacheBody.localScale().y / 2 + 0.02
            )
          ),
        cache
          .localPosition()
          .clone()
          .lerp(ram.localPosition(), 0.5)
          .add(new Vector3(0, -0.001, -0.15)),
        ram.localPosition().clone().add(new Vector3(0, -0.05, -0.09)),
      ]}
      lineWidth={0}
      color="memory"
      smooth
      key="level_3 wire_cache_ram_data"
    />
  ) as Line;

  const wire_cache_ram_address = (
    <Line
      points={[
        cache
          .localPosition()
          .clone()
          .add(
            new Vector3(
              cacheBody.localScale().x / 2 - 0.02,
              -0.12,
              cacheBody.localScale().y / 2
            )
          ),
        cache
          .localPosition()
          .clone()
          .lerp(ram.localPosition(), 0.5)
          .add(new Vector3(0, -0.001, 0.1)),
        ram.localPosition().clone().add(new Vector3(0, -0.05, -0.055)),
      ]}
      lineWidth={0}
      color="busAddr"
      smooth
      key="level_3 wire_cache_ram_address"
    />
  ) as Line;

  const wire_clock_cu = (
    <Line
      points={[
        clock.localPosition().clone(),
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
      key="level_3 wire_clock_cu"
    />
  ) as Line;

  const wire_gpr_alu = (
    <Line
      points={[
        gpr
          .localPosition()
          .clone()
          .add(new Vector3(0, -gpr.localScale().y / 2, 0.01)),
        gpr
          .localPosition()
          .clone()
          .lerp(alu.localPosition(), 0.55)
          .add(new Vector3(0.01, 0, 0.01)),
        alu
          .localPosition()
          .clone()
          .add(new Vector3(0, alu.localScale().y / 2, 0.01)),
      ]}
      lineWidth={0}
      color="register"
      smooth
      key="level_3 wire_gpr_alu"
    />
  ) as Line;

  const wire_fpr_fpu = (
    <Line
      points={[
        fpr
          .localPosition()
          .clone()
          .add(new Vector3(0, -fpr.localScale().y / 2, 0.015)),
        fpr
          .localPosition()
          .clone()
          .lerp(fpu.localPosition(), 0.5)
          .add(new Vector3(0.0, -0.05, 0.015)),
        fpu
          .localPosition()
          .clone()
          .add(new Vector3(0, fpu.localScale().y / 2, 0.015)),
      ]}
      lineWidth={0}
      color="fpu"
      smooth
      key="level_3 wire_fpr_fpu"
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
      key="level_3 wire_gpr_mc"
    />
  ) as Line;

  const wire_fpu_gpr = (
    <Line
      points={[
        fpu
          .localPosition()
          .clone()
          .add(
            new Vector3(
              -fpu.localScale().x / 2 + 0.02,
              -fpu.localScale().y / 2,
              0.01
            )
          ),
        fpu
          .localPosition()
          .clone()
          .lerp(gpr.localPosition(), 0.5)
          .add(new Vector3(-0.05, -0.04, 0.01)),
        gpr
          .localPosition()
          .clone()
          .add(new Vector3(gpr.localScale().x / 2, -0.02, 0.01)),
      ]}
      lineWidth={0}
      color="fpu"
      smooth
      key="level_3 wire_fpu_gpr"
    />
  ) as Line;

  const wire_cu_pc = (
    <Line
      points={[
        cu
          .localPosition()
          .clone()
          .add(new Vector3(0, cu.localScale().y / 2 - 0.13, 0)),
        cu.localPosition().clone().add(new Vector3(0, -0.15, 0)),
        pc
          .localPosition()
          .clone()
          .add(new Vector3(-pc.localScale().y / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="alu"
      smooth
      key="level_3 wire_cu_pc"
    />
  ) as Line;

  const wire_pc_mc = (
    <Line
      points={[
        pc
          .localPosition()
          .clone()
          .add(new Vector3(pc.localScale().x / 2, 0, 0)),
        mc
          .localPosition()
          .clone()
          .add(new Vector3(-mc.localScale().x / 2 - 0.04, -0.16, 0)),
        mc
          .localPosition()
          .clone()
          .add(new Vector3(0, -mc.localScale().x / 2, 0)),
      ]}
      lineWidth={0}
      color="alu"
      smooth
      key="level_3 wire_pc_mc"
    />
  ) as Line;

  const wire_decode_cu = (
    <Line
      points={[
        decode
          .localPosition()
          .clone()
          .add(new Vector3(0, -decode.localScale().y / 2, 0)),
        decode
          .localPosition()
          .clone()
          .lerp(cu.localPosition(), 0.6)
          .add(new Vector3(-0.01, -0.02, 0.005)),
        cu
          .localPosition()
          .clone()
          .add(new Vector3(-cu.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="control"
      smooth
      key="level_3 wire_decode_cu"
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
      key="level_3 wire_ir_decode"
    />
  ) as Line;

  const wire_instruction_bus = (
    <Line
      points={[
        mc
          .localPosition()
          .clone()
          .add(new Vector3(0.02, mc.localScale().y / 2, 0.03)),
        mc
          .localPosition()
          .clone()
          .lerp(ir.localPosition(), 0.35)
          .add(new Vector3(0.22, 0.32, 0.05)),
        mc
          .localPosition()
          .clone()
          .lerp(ir.localPosition(), 0.7)
          .add(new Vector3(-0.22, 0.32, 0.05)),
        ir
          .localPosition()
          .clone()
          .add(new Vector3(0, ir.localScale().y / 2, -0.02)),
      ]}
      lineWidth={0}
      color="bus"
      smooth
      key="level_3 wire_instruction_bus"
    />
  ) as Line;

  const wire_decode_gpr = (
    <Line
      points={[
        decode.localPosition().clone().add(new Vector3(0.06, -0.02, 0)),
        decode
          .localPosition()
          .clone()
          .lerp(gpr.localPosition(), 0.5)
          .add(new Vector3(0.02, 0, 0.005)),
        gpr
          .localPosition()
          .clone()
          .add(new Vector3(-gpr.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="decoder"
      smooth
      key="level_3 wire_decode_gpr"
    />
  ) as Line;

  const wire_decode_fpu = (
    <Line
      points={[
        decode
          .localPosition()
          .clone()
          .add(new Vector3(decode.localScale().x / 2, 0, 0)),
        decode
          .localPosition()
          .clone()
          .lerp(fpu.localPosition(), 0.55)
          .add(new Vector3(0.04, 0, 0.006)),
        fpu
          .localPosition()
          .clone()
          .add(new Vector3(-fpu.localScale().x / 2, 0.02, 0)),
      ]}
      lineWidth={0}
      color="fpu"
      smooth
      key="level_3 wire_decode_fpu"
    />
  ) as Line;

  const wire_decode_stack = (
    <Line
      points={[
        decode
          .localPosition()
          .clone()
          .add(new Vector3(0.02, decode.localScale().y / 2, 0)),
        decode
          .localPosition()
          .clone()
          .lerp(stackPointers.localPosition(), 0.55)
          .add(new Vector3(0.02, 0.03, 0.008)),
        stackPointers
          .localPosition()
          .clone()
          .add(new Vector3(-0.02, -0.08, 0.01)),
      ]}
      lineWidth={0}
      color="control"
      smooth
      key="level_3 wire_decode_stack"
    />
  ) as Line;

  const wire_stack_mc = (
    <Line
      points={[
        stackPointers.localPosition().clone().add(new Vector3(0, -0.18, 0.01)),
        stackPointers
          .localPosition()
          .clone()
          .lerp(mc.localPosition(), 0.55)
          .add(new Vector3(0.08, -0.05, 0.015)),
        mc
          .localPosition()
          .clone()
          .add(new Vector3(-mc.localScale().x / 2, -0.02, 0)),
      ]}
      lineWidth={0}
      color="memory"
      smooth
      key="level_3 wire_stack_mc"
    />
  ) as Line;

  const wire_stack_pc = (
    <Line
      points={[
        stackPointers
          .localPosition()
          .clone()
          .add(new Vector3(-0.08, -0.14, 0.01)),
        stackPointers
          .localPosition()
          .clone()
          .lerp(pc.localPosition(), 0.55)
          .add(new Vector3(-0.04, -0.14, 0.012)),
        pc
          .localPosition()
          .clone()
          .add(new Vector3(pc.localScale().x / 2, 0, 0)),
      ]}
      lineWidth={0}
      color="control"
      smooth
      key="level_3 wire_stack_pc"
    />
  ) as Line;

  const wires = {
    wire_cu_alu,
    wire_cu_fpu,
    wire_alu_mc,
    wire_fpu_mc,
    wire_gpr_alu,
    wire_fpr_fpu,
    wire_gpr_mc,
    wire_fpu_gpr,
    wire_cu_pc,
    wire_pc_mc,
    wire_clock_cu,
    wire_instruction_bus,
    wire_ir_decode,
    wire_decode_cu,
    wire_decode_gpr,
    wire_decode_fpu,
    wire_decode_stack,
    wire_stack_mc,
    wire_stack_pc,
    wire_mc_cache_data,
    wire_mc_cache_address,
    wire_cache_ram_data,
    wire_cache_ram_address,
  };

  const wires_array = Object.values(wires);

  const wireWidths = new Map<Line, number>([
    [wire_cu_alu, 7],
    [wire_cu_fpu, 7],
    [wire_alu_mc, 7],
    [wire_fpu_mc, 7],
    [wire_gpr_alu, 6],
    [wire_fpr_fpu, 7],
    [wire_gpr_mc, 6],
    [wire_fpu_gpr, 6],
    [wire_cu_pc, 6],
    [wire_pc_mc, 5],
    [wire_clock_cu, 5],
    [wire_instruction_bus, INSTRUCTION_BUS_WIDTH],
    [wire_ir_decode, 7],
    [wire_decode_cu, 5],
    [wire_decode_gpr, 5],
    [wire_decode_fpu, 6],
    [wire_decode_stack, 5],
    [wire_stack_mc, 6],
    [wire_stack_pc, 5],
    [wire_mc_cache_data, 7],
    [wire_mc_cache_address, 7],
    [wire_cache_ram_data, 9],
    [wire_cache_ram_address, 8],
  ]);

  [
    pc,
    cu,
    alu,
    fpu,
    ir,
    mc,
    gpr,
    fpr,
    stackPointers,
    clock,
    decode,
    cpu_base,
    cache,
    wire_cu_alu,
    wire_cu_fpu,
    wire_alu_mc,
    wire_fpu_mc,
    wire_gpr_alu,
    wire_fpr_fpu,
    wire_gpr_mc,
    wire_fpu_gpr,
    wire_cu_pc,
    wire_pc_mc,
    wire_clock_cu,
    wire_instruction_bus,
    wire_ir_decode,
    wire_decode_cu,
    wire_decode_gpr,
    wire_decode_fpu,
    wire_decode_stack,
    wire_stack_mc,
    wire_stack_pc,
    wire_mc_cache_data,
    wire_mc_cache_address,
    alu_flags,
  ].forEach((item) => cpu.add(item));

  [wire_cache_ram_data, wire_cache_ram_address, cpu, ram].forEach((item) =>
    container.add(item)
  );

  if (addToScene) {
    scene.add(container);
    scene.init();
  }

  const api = {
    group: cpu,
    base: cpu_base,
    container,
    ram,
    cu,
    alu,
    fpu,
    mc,
    gpr,
    fpr,
    stackPointers,
    cache,
    ir,
    pc,
    clock,
    decode,
    cacheData,
    cacheInstr,
    bp,
    sp,
    ...wires,
    wire_cu_iu: wire_cu_alu,
    wire_iu_mc: wire_alu_mc,
    wire_gpr_iu: wire_gpr_alu,
    wire_mc_ir: wire_instruction_bus,
    wire_mc_ram_data: wire_cache_ram_data,
    wire_mc_ram_address: wire_cache_ram_address,
    wires: wires_array,
    initWires: function* (wires: Line[] = wires_array, duration?: number) {
      yield all(
        ...wires.map((wire) =>
          wire.widthTo(wireWidths.get(wire) ?? 8, duration)
        )
      );
      yield all(...wires.map((wire) => wire.popInDraw()));
    },

    flags: {
      Z: flag_Z,
      N: flag_N,
      V: flag_V,
      DZ: flag_DZ,
      defs: FLAG_DEFS,

      *set(flag: "Z" | "N" | "V" | "DZ", duration = 0.3) {
        const target = this[flag];
        yield target.pulse(1.2);
        yield* all(target.glowTo(this.defs[flag].on, duration));
      },
      *clear(flag: "Z" | "N" | "V" | "DZ", duration = 0.3) {
        const target = this[flag];
        yield target.pulse(1 / 1.2);
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
