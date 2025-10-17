import { Grid, Icon, makeScene2D } from "@motion-canvas/2d";
import { createScene } from "../components/presets";
import { Vector2, Vector3 } from "three";
import { buildCPULevel3 } from "../utils/cpus/buildCPULevel3";
import {
  all,
  chain,
  createRefArray,
  createSignal,
  easeInOutCubic,
  easeInOutSine,
  easeOutBack,
  easeOutSine,
  range,
  sequence,
  waitFor,
  waitUntil,
  useRandom,
  easeInCubic,
} from "@motion-canvas/core";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { Label3D } from "../components/Label3D";
import { Glass } from "../components/GlassRect";
import {
  GlassBodyText,
  GlowBadge,
  GlowPanelTitle,
} from "../components/TextPresets";

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(-1.5, 0.5, -1.5));
  const cpu = buildCPULevel3(scene);
  const generator = useRandom(8);

  const camera = scene.getCameraClass();

  view.add(scene);
  scene.init();

  yield* waitUntil("begin");
  yield* camera.moveTo(
    cpu.fpu
      .getGlobalPosition()
      .add(new Vector3(-0.9, 0.5, -0.2).multiplyScalar(2)),
    0
  );
  yield* camera.lookTo(
    cpu.fpu.getGlobalPosition().add(new Vector3(0.3, -0.1, 0.05)),
    0
  );

  yield* all(cpu.group.popIn(1), cpu.ram.popIn(1, RAM_SCALE));
  yield camera.moveTo(
    cpu.fpu.getGlobalPosition().add(new Vector3(0, 1, -0.2).multiplyScalar(2)),
    1.5
  );
  yield* camera.lookTo(
    cpu.fpu.getGlobalPosition().add(new Vector3(0.5, -0.1, 0.05)),
    1.5
  );

  yield* waitUntil("empty cache");

  yield* cpu.initWires([
    cpu.wire_cache_ram_address,
    cpu.wire_cache_ram_data,
    cpu.wire_mc_cache_data,
    cpu.wire_mc_cache_address,
  ]);

  const spacing = createSignal<Vector2>(new Vector2(220, 160));
  const cacheSlots = createRefArray<GlowPanelTitle>();
  const policyTextRefs = createRefArray<GlassBodyText>();
  const policyIconRefs = createRefArray<Icon>();
  const dataGridSpacing = createSignal<Vector2>(new Vector2(260, 170));
  const instructionGridSpacing = createSignal<Vector2>(new Vector2(260, 170));
  const dataCells = createRefArray<GlowPanelTitle>();
  const instructionCells = createRefArray<GlowPanelTitle>();
  let dataGrid: Glass | null = null;
  let instructionGrid: Glass | null = null;
  const chunkIndices = range(4).map((row) =>
    range(4).map((column) => row * 4 + column)
  );
  const allSlotIndices = chunkIndices.flat();
  let lastAddedChunk = chunkIndices.length - 1;
  const emptyHint = (
    <GlassBodyText
      initialVisibility={false}
      text={"EMPTY"}
      fontSize={90}
      opacity={0.85}
      y={0}
    />
  ) as GlassBodyText;
  const cacheContents = (
    <Label3D
      scene={scene}
      worldPosition={() => cpu.cache.getGlobalPosition()}
      color="control"
      offset2D={[-1200, -420]}
      size={[1100, 860]}
      clip
      translucency={1}
      text={""}
    >
      <Grid
        lineWidth={3}
        zIndex={1}
        stroke={"#ffffff30"}
        spacing={spacing}
        size="100%"
      />
      {emptyHint}
      {...range(4).flatMap((row) =>
        range(4).map((column) => (
          <GlowPanelTitle
            ref={cacheSlots}
            initialVisibility={false}
            text={""}
            zIndex={2}
            fontSize={48}
            fontWeight={500}
            x={() => (column - 1.5) * spacing().x}
            y={() => (row - 1.5) * spacing().y}
            textAlign={"center"}
            lineHeight={52}
          />
        ))
      )}
    </Label3D>
  ) as Label3D;
  const cacheTitle = (
    <GlowBadge
      initialVisibility={false}
      text={"CACHE"}
      bottom={cacheContents.top}
      x={cacheContents.x}
      padding={16}
    />
  ) as GlowBadge;
  const cacheMissLabel = (
    <GlowBadge
      initialVisibility={false}
      text={"CACHE MISS (X)"}
      y={() => cacheContents.bottom().y + 140}
      x={cacheContents.x}
    />
  ) as GlowBadge;
  const cacheHitLabel = (
    <GlowBadge
      initialVisibility={false}
      text={"CACHE HIT (OK)"}
      fill={"#f7c81f"}
      shadowColor={"#f7c81f88"}
      y={() => cacheContents.bottom().y + 140}
      x={cacheContents.x}
    />
  ) as GlowBadge;

  view.add(cacheContents);
  view.add(cacheTitle);
  view.add(cacheMissLabel);
  view.add(cacheHitLabel);
  const policyEntries = [
    {
      icon: "mdi:clock-outline",
      label: "Most Recently Used (MRU)",
      cue: "policy mru",
    },
    {
      icon: "mdi:pulse",
      label: "Least Frequently Used (LFU)",
      cue: "policy lfu",
    },
    {
      icon: "mdi:history",
      label: "Least Recently Used (LRU)",
      cue: "policy lru",
    },
    {
      icon: "mdi:chart-bar",
      label: "Most Frequently Used (MFU)",
      cue: "policy mfu",
    },
    {
      icon: "mdi:dice-6",
      label: "Pseudorandom (removes a random line)",
      cue: "policy random",
    },
    {
      icon: "mdi:vector-combine",
      label: "Hybrid strategies (combining several techniques)",
      cue: "policy hybrid",
    },
    { icon: "mdi:dots-horizontal", label: "etc", cue: "policy etc" },
  ];
  const policyGlass = (
    <Glass
      scale={0}
      size={[1000, 900]}
      x={() => cacheContents.x() + 2550}
      y={() => cacheContents.y()}
      radius={64}
      translucency={1}
      lightness={0.05}
    >
      <GlowPanelTitle
        text={"REPLACEMENT POLICIES"}
        fontSize={72}
        y={-320}
        zIndex={2}
      />
      {...policyEntries.flatMap((entry, index) => [
        <Icon
          ref={policyIconRefs}
          icon={entry.icon}
          color={"#fffd"}
          width={64}
          x={-340}
          y={-200 + index * 90}
          scale={1}
          zIndex={2}
        />,
        <GlassBodyText
          ref={policyTextRefs}
          text={`${index + 1}. ${entry.label}`}
          zIndex={2}
          fontSize={46}
          fontWeight={600}
          textAlign={"left"}
          width={500}
          x={-20}
          y={-200 + index * 90}
        />,
      ])}
    </Glass>
  ) as Glass;

  yield* all(
    cacheContents.scale(1.5, 1, easeOutBack),
    cacheTitle.popIn("CACHE", 0.6)
  );
  yield* emptyHint.popIn("EMPTY", 0.4);

  yield* waitUntil("spatial fill");
  yield* emptyHint.popOut("", 0.4);

  const randomQuarterRaw = () => {
    const digitCount = generator.nextInt(1, 6);
    const min = digitCount === 1 ? 0 : Math.pow(10, digitCount - 1);
    const max = Math.pow(10, digitCount) - 1;
    const magnitude = generator.nextInt(min, max + 1);
    const negative = magnitude > 0 && generator.nextInt(0, 2) === 0;
    const value = negative ? -magnitude : magnitude;
    return value.toString();
  };
  const randomQuarter = () => randomQuarterRaw();
  const randomLine = () => range(4).map(() => randomQuarterRaw());
  const randomDataValue = () => {
    const digits = generator.nextInt(1, 6);
    const min = digits === 1 ? 0 : Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    let value = generator.nextInt(min, max + 1);
    if (generator.nextInt(0, 4) === 0 && value !== 0) value *= -1;
    return value.toString();
  };
  const randomInstructionValue = () =>
    "0x" +
    generator
      .nextInt(0, 0xfff)
      .toString(16)
      .padStart(3, "0")
      .toUpperCase();

  const driveCacheQuery = (duration = 0.6, speed = 110) =>
    cpu.wire_mc_cache_address.currentFlow(duration, easeInOutSine, speed);

  const driveRamPath = (duration = 0.6, speed = 110) =>
    all(
      cpu.wire_cache_ram_address.currentFlow(duration, easeInOutSine, speed),
      cpu.wire_cache_ram_data.currentFlow(duration, easeOutSine, speed),
      cpu.wire_mc_cache_data.currentFlow(duration, easeOutSine, speed)
    );

  const runBurstFlow = () => all(driveCacheQuery(), driveRamPath());

  const fillGroups = [
    [0, 1, 4, 5],
    [2, 3, 6, 7],
  ];

  for (const group of fillGroups) {
    const line = randomLine();
    yield* all(
      runBurstFlow(),
      ...group.map((index, i) => cacheSlots[index].popIn(line[i], 0.45))
    );
    yield* waitFor(0.12);
  }

  const searchOrder = fillGroups.flat();

  yield* waitUntil("cache search");
  yield* all(
    sequence(
      0.12,
      ...searchOrder.map((index) =>
        chain(
          cacheSlots[index].scale(1.12, 0.18, easeOutBack),
          all(
            cacheSlots[index].scale(1, 0.2, easeInOutSine),
            cacheSlots[index].opacity(0.4, 0.2)
          )
        )
      )
    ),
    driveCacheQuery(1.3, 80)
  );

  yield* waitUntil("cache miss fetch");
  yield* cacheMissLabel.popIn("CACHE MISS (X)", 0.6);
  yield* waitFor(0.2);

  const missBurst = () => all(driveCacheQuery(0.9, 80), driveRamPath(0.9, 80));

  const missGroup = [8, 9, 12, 13];
  const missLine = randomLine();

  yield* all(
    missBurst(),
    ...missGroup.map((index, i) => cacheSlots[index].popIn(missLine[i], 0.55))
  );

  yield* sequence(
    0.08,
    ...missGroup.map((index) =>
      chain(
        cacheSlots[index].scale(1.1, 0.2, easeOutBack),
        cacheSlots[index].scale(1, 0.25, easeInOutSine)
      )
    )
  );

  yield* waitFor(0.4);
  yield* cacheMissLabel.popOut("", 0.3);

  const hitIndex = fillGroups[0][0];
  const hitSlot = cacheSlots[hitIndex];
  const HIT_COLOR = "#f7c81f";
  const HIT_SHADOW = "#f7c81fa0";

  yield* waitUntil("cache hit");
  yield* all(
    driveCacheQuery(0.75, 120),
    cpu.wire_mc_cache_data.currentFlow(0.75, easeOutSine, 120),
    chain(
      hitSlot.opacity(1, 0.001),
      hitSlot.fill(HIT_COLOR, 0.3),
      hitSlot.shadowColor(HIT_SHADOW, 0.3),
      hitSlot.scale(1.25, 0.35, easeOutBack),
      hitSlot.scale(1.15, 0.25, easeInOutSine)
    )
  );
  yield* cacheHitLabel.popIn("CACHE HIT (OK)", 0.5);

  const restSlots = searchOrder.filter((index) => index !== hitIndex);
  if (restSlots.length) {
    yield* all(
      ...restSlots.map((index) => cacheSlots[index].opacity(0.7, 0.4))
    );
  }

  yield* waitFor(0.2);
  yield* waitUntil("maximize hits");
  yield* all(
    cacheHitLabel.scale(1.3, 0.45, easeOutBack),
    hitSlot.scale(1.35, 0.45, easeOutBack)
  );
  yield* all(
    cacheHitLabel.scale(1, 0.35, easeInOutSine),
    hitSlot.scale(1.15, 0.35, easeInOutSine)
  );

  const SLOT_DEFAULT_COLOR = "#fff";
  const SLOT_DIM_OPACITY = 0.08;

  function* loadSlot(index: number, value: string, withBounce = true) {
    const slot = cacheSlots[index];
    if (!slot) return;
    if (withBounce) {
      yield* slot.scale(0.9, 0.09, easeInOutSine);
    }
    yield* all(
      slot.fill(SLOT_DEFAULT_COLOR, 0.1),
      slot.text(value, 0.125),
      slot.opacity(1, 0.125)
    );
    if (withBounce) {
      yield* slot.scale(1.15, 0.125, easeOutBack);
      yield* slot.scale(1, 0.1, easeInOutSine);
    } else {
      slot.scale(1);
    }
    lastAddedChunk = Math.floor(index / 4);
  }

  function* unloadSlot(index: number, withBounce = true) {
    const slot = cacheSlots[index];
    if (!slot) return;
    if (withBounce) {
      yield* slot.scale(0.9, 0.09, easeInOutSine);
    }
    yield* all(slot.text("", 0.125), slot.opacity(SLOT_DIM_OPACITY, 0.125));
    if (withBounce) {
      yield* slot.scale(0.7, 0.1, easeInOutSine);
    } else {
      slot.scale(0.9);
    }
    slot.fill(SLOT_DEFAULT_COLOR, 0.025);
  }

  function* highlightChunk(chunkIndex: number) {
    const chunk = chunkIndices[chunkIndex] ?? [];
    if (!chunk.length) return;
    yield* sequence(
      0.02,
      ...chunk.map((index) =>
        chain(
          cacheSlots[index].fill(HIT_COLOR, 0.1),
          cacheSlots[index].scale(1.2, 0.11, easeOutBack)
        )
      )
    );
  }

  function* removeChunk(chunkIndex: number) {
    const chunk = chunkIndices[chunkIndex] ?? [];
    if (!chunk.length) return;
    yield* sequence(0.025, ...chunk.map((index) => unloadSlot(index)));
  }

  function* stealthRefill() {
    const values = allSlotIndices.map(() => randomQuarter());
    for (let i = 0; i < allSlotIndices.length; i++) {
      const slotIndex = allSlotIndices[i];
      const slot = cacheSlots[slotIndex];
      if (!slot) continue;
      slot.fill(SLOT_DEFAULT_COLOR);
      slot.text(values[i], 0);
      slot.opacity(SLOT_DIM_OPACITY);
      slot.scale(0.9);
    }
    yield* sequence(
      0.0075,
      ...allSlotIndices.map((index) =>
        all(
          cacheSlots[index].opacity(1, 0.06),
          cacheSlots[index].scale(1, 0.06)
        )
      )
    );
    lastAddedChunk = chunkIndices.length - 1;
  }

  function* stealthRefillChunk(chunkIndex: number) {
    const chunk = chunkIndices[chunkIndex] ?? [];
    if (!chunk.length) return;
    const values = chunk.map(() => randomQuarter());
    chunk.forEach((slotIndex, i) => {
      const slot = cacheSlots[slotIndex];
      if (!slot) return;
      slot.fill(SLOT_DEFAULT_COLOR);
      slot.text("", 0);
      slot.opacity(SLOT_DIM_OPACITY);
      slot.scale(0.9);
    });
    yield* sequence(
      0.0075,
      ...chunk.map((slotIndex, i) =>
        all(
          cacheSlots[slotIndex].text(values[i], 0.06),
          cacheSlots[slotIndex].opacity(1, 0.06),
          cacheSlots[slotIndex].scale(1, 0.06)
        )
      )
    );
    lastAddedChunk = chunkIndex;
  }

  yield* waitUntil("eviction");
  const prefillChunk = chunkIndices[chunkIndices.length - 1];
  yield* all(
    driveCacheQuery(0.275, 90),
    driveRamPath(0.275, 90),
    sequence(0.025, ...prefillChunk.map((index) => unloadSlot(index)))
  );

  yield* waitUntil("sequential refill");
  for (const [chunkIndex, chunk] of chunkIndices.entries()) {
    const values = chunk.map(() => randomQuarter());
    yield* all(
      driveCacheQuery(0.325, 95),
      driveRamPath(0.325, 95),
      sequence(
        0.02,
        ...chunk.map((slotIndex, i) => loadSlot(slotIndex, values[i]))
      )
    );
    yield* waitFor(0.04);
  }

  yield* waitUntil("policy list");
  view.add(policyGlass);
  yield* policyGlass.scale(1, 0.35, easeOutBack);

  const POLICY_ICON_DEFAULT = "#fffd";
  const POLICY_TEXT_DEFAULT = "#ededed";
  const POLICY_HIGHLIGHT = "#f7c81f";
  const policyChunkSelector = [
    () => lastAddedChunk,
    () => generator.nextInt(0, chunkIndices.length),
    () => 0,
    () => Math.min(1, chunkIndices.length - 1),
    () => generator.nextInt(0, chunkIndices.length),
    () => Math.min(2, chunkIndices.length - 1),
    () => Math.max(0, chunkIndices.length - 1),
  ];

  for (const [index, entry] of policyEntries.entries()) {
    yield* waitUntil(entry.cue);
    yield* all(
      policyTextRefs[index].fill(POLICY_HIGHLIGHT, 0.15),
      policyTextRefs[index].scale(1.08, 0.15, easeOutBack),
      policyIconRefs[index].color(POLICY_HIGHLIGHT, 0.15),
      policyIconRefs[index].scale(1.2, 0.15, easeOutBack)
    );
    const selector =
      policyChunkSelector[index] ??
      (() => generator.nextInt(0, chunkIndices.length));
    const chunkIndex =
      ((selector() % chunkIndices.length) + chunkIndices.length) %
      chunkIndices.length;
    const chunk = chunkIndices[chunkIndex] ?? [];
    yield* highlightChunk(chunkIndex);
    yield* waitFor(0.025);
    yield* removeChunk(chunkIndex);
    yield* waitFor(0.02);
    yield* stealthRefillChunk(chunkIndex);
    yield* all(
      policyTextRefs[index].fill(POLICY_TEXT_DEFAULT, 0.15),
      policyTextRefs[index].scale(1, 0.125, easeInOutSine),
      policyIconRefs[index].color(POLICY_ICON_DEFAULT, 0.15),
      policyIconRefs[index].scale(1, 0.125, easeInOutSine)
    );
  }

  // yield* waitUntil("random loads");
  // for (const _ of range(4)) {
  //   const poolIndex = generator.nextInt(0, allSlotIndices.length);
  //   const index = allSlotIndices[poolIndex];
  //   const slot = cacheSlots[index];
  //   const canUnload = slot.opacity() > 0.3;
  //   const unload = canUnload && generator.nextInt(0, 3) === 0;

  //   yield* all(
  //     driveCacheQuery(0.35, 95),
  //     driveRamPath(0.35, 95),
  //     unload ? unloadSlot(index) : loadSlot(index, randomQuarter())
  //   );
  //   yield* waitFor(0.06);
  // }

  yield* waitUntil("data instruction");

  yield* all(
    cacheContents.scale(0, 0.5, easeInCubic),
    cacheHitLabel.popOut(),
    cacheTitle.popOut(),
    policyGlass.scale(0, 0.5, easeInCubic)
  );
  cacheContents.remove();
  cacheTitle.remove();
  cacheHitLabel.remove();
  cacheMissLabel.remove();
  policyGlass.remove();

  yield* waitUntil("data");
  if (!dataGrid) {
    dataGrid = (
      <Glass
        scale={0}
        size={[1200, 780]}
        x={-1350}
        y={520}
        radius={72}
        shadowColor={"#ff9ad688"}
        fill={"#ff9ad628"}
        translucency={0.75}
        lightness={0.14}
      >
        {...range(4).flatMap((row) =>
          range(4).map((column) => (
            <GlowPanelTitle
              ref={dataCells}
              initialVisibility={false}
              zIndex={2}
              text={""}
              fontSize={66}
              fontWeight={700}
              textAlign={"center"}
              lineHeight={58}
              x={() => (column - 1.5) * dataGridSpacing().x}
              y={() => (row - 1.5) * dataGridSpacing().y}
            />
          ))
        )}
      </Glass>
    ) as Glass;
    instructionGrid = (
      <Glass
        scale={0}
        size={[1200, 780]}
        x={1350}
        y={520}
        radius={72}
        shadowColor={"#9ec4ff88"}
        fill={"#9ec4ff26"}
        translucency={0.75}
        lightness={0.1}
      >
        {...range(4).flatMap((row) =>
          range(4).map((column) => (
            <GlowPanelTitle
              ref={instructionCells}
              zIndex={2}
              initialVisibility={false}
              text={""}
              fontSize={66}
              fontWeight={700}
              textAlign={"center"}
              lineHeight={58}
              x={() => (column - 1.5) * instructionGridSpacing().x}
              y={() => (row - 1.5) * instructionGridSpacing().y}
            />
          ))
        )}
      </Glass>
    ) as Glass;
    view.add(dataGrid);
    view.add(instructionGrid);
  }

  const data_label = (
    <Label3D
      scene={scene}
      text={"DATA"}
      worldPosition={new Vector3(0.6, -0.25, -0.15)}
      offset2D={[0, -700]}
      width={800}
      height={250}
      fontSize={120}
      color="memory"
    />
  ) as Label3D;
  const address_label = (
    <Label3D
      scene={scene}
      text={"ADDRESSES"}
      worldPosition={new Vector3(0.6, -0.22, 0.25)}
      offset2D={[0, -1000]}
      width={800}
      height={250}
      fontSize={120}
      color="cache"
    />
  ) as Label3D;
  view.add(data_label);
  view.add(address_label);
  yield* all(
    camera.moveTo(
      cpu.cache
        .getGlobalPosition()
        .add(new Vector3(-0.25, 0.45, -0.3).multiplyScalar(2)),
      1,
      easeInOutCubic
    ),
    camera.lookTo(
      cpu.cache.getGlobalPosition().add(new Vector3(0.12, -0.08, -0.04)),
      1,
      easeInOutCubic
    ),
    dataGrid!.scale(1, 0.35, easeOutBack),
    data_label.popIn(0.35)
  );
  const dataValues = dataCells.map(() => randomDataValue());
  yield* sequence(
    0.02,
    ...dataCells.map((cell, index) => cell.popIn(dataValues[index], 0.28))
  );

  yield* waitUntil("address");
  const instructionValues = instructionCells.map(() =>
    randomInstructionValue()
  );
  yield* all(
    camera.moveForward(-1, 1),
    camera.lookTo(new Vector3(0.6, -0.15, 0.25), 1, easeInOutCubic),
    instructionGrid!.scale(1, 0.35, easeOutBack),
    address_label.popIn(0.35)
  );
  yield* sequence(
    0.02,
    ...instructionCells.map((cell, index) =>
      cell.popIn(instructionValues[index], 0.28)
    )
  );

  yield* waitUntil("restore");
  yield* all(
    camera.lookTo(new Vector3(0.6, -0.42, 0), 1, easeInOutCubic),
    camera.moveTo(new Vector3(-0.5, 0.1, 0), 1, easeInOutCubic),
    dataGrid!.x(-1050, 1, easeInOutCubic),
    dataGrid!.scale(0.92, 1, easeInOutCubic),
    instructionGrid!.x(1050, 1, easeInOutCubic),
    instructionGrid!.scale(0.92, 1, easeInOutCubic),
    data_label.offset2D([250, -250], 1),
    address_label.offset2D([-600, -200], 1),
    data_label.scale(0.5, 1),
    address_label.scale(0.5, 1)
  );
  yield* waitUntil("next");
});
