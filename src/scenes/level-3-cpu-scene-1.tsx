import { invert, makeScene2D } from "@motion-canvas/2d";
import {
  all,
  waitFor,
  waitUntil,
  Vector2,
  sequence,
  easeOutSine,
  useRandom,
  delay,
  chain,
  easeInSine,
} from "@motion-canvas/core";
import { createScene } from "../components/presets";
import { Vector3 } from "three";
import { buildCPULevel3 } from "../utils/cpus/buildCPULevel3";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { Label3D } from "../components/Label3D";
import Model from "../libs/Thrash/objects/Model";
import { addTowerSpotlight } from "../libs/Thrash/components/showlight";

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(-1.5, 0.5, -1.5));
  const cpu = buildCPULevel3(scene);

  const generator = useRandom(0);

  view.add(scene);
  scene.init();

  const camera = scene.getCameraClass();
  const initialCameraPosition = camera.localPosition().clone();
  yield* camera.lookTo(new Vector3(0, -0.5, 0), 0);
  yield* camera.lookTo(new Vector3(0, -0.5, 0), 0);
  yield* all(cpu.group.popIn(1), cpu.ram.popIn(1, RAM_SCALE));
  // yield* cpu.initWires(cpu.wires, 1);

  scene.scene.updateMatrixWorld(true);

  const upAxis = new Vector3(0, 1, 0);

  const bpPosition = cpu.bp.getGlobalPosition();
  const spPosition = cpu.sp.getGlobalPosition();
  const cachePosition = cpu.cache.getGlobalPosition();
  const fpuPosition = cpu.fpu.getGlobalPosition();

  const computeApproach = (
    target: Vector3,
    distance = 0.75,
    elevation = 0.4,
    lateralBias = 0
  ) => {
    const toInitial = initialCameraPosition.clone().sub(target);
    if (toInitial.lengthSq() < 1e-4) {
      toInitial.set(1, 0, -1);
    }
    toInitial.normalize();

    let lateral = new Vector3().crossVectors(upAxis, toInitial);
    if (lateral.lengthSq() < 1e-4) {
      lateral = new Vector3(1, 0, 0);
    } else {
      lateral.normalize();
    }

    return target
      .clone()
      .add(toInitial.multiplyScalar(distance))
      .add(upAxis.clone().multiplyScalar(elevation))
      .add(lateral.multiplyScalar(lateralBias));
  };

  const bpView = computeApproach(bpPosition, 0.75, 0.42, -0.18);
  const spView = computeApproach(spPosition, 0.72, 0.38, 0.18);
  const fpuView = computeApproach(fpuPosition, 0.85, 0.4, 0.12);

  const toInitialFromCache = initialCameraPosition.clone().sub(cachePosition);
  if (toInitialFromCache.lengthSq() < 1e-4) {
    toInitialFromCache.set(1, 0, 0);
  }
  toInitialFromCache.normalize();

  let cacheRight = toInitialFromCache.clone().cross(upAxis);
  if (cacheRight.lengthSq() < 1e-4) {
    cacheRight = new Vector3(0, 0, 1);
  } else {
    cacheRight.normalize();
  }

  const cacheOrbitRadius = 0.85;
  const cacheOrbitHeight = 0.34;
  const cacheOrbitAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const cacheOrbitWaypoints = cacheOrbitAngles.map((angle) => {
    const forwardComponent = toInitialFromCache
      .clone()
      .multiplyScalar(Math.cos(angle) * cacheOrbitRadius);
    const rightComponent = cacheRight
      .clone()
      .multiplyScalar(Math.sin(angle) * cacheOrbitRadius);
    return cachePosition
      .clone()
      .add(forwardComponent)
      .add(rightComponent)
      .add(upAxis.clone().multiplyScalar(cacheOrbitHeight));
  });

  yield* waitUntil("begin");

  const showlight = addTowerSpotlight(scene, new Vector3(0, 1, 0), 1);

  const names = ["BP", "SP", "CACHE", "FPU"];
  const labels = names.map((name, i)=>(<Label3D
    text={name}
    worldPosition={[cpu.bp, cpu.sp, cpu.cache, cpu.fpu].map(c=>c.getGlobalPosition())[i]}
    scene={scene}
  />));
  labels.map(lbl=>view.add(lbl));
  
  const highlightTarget = (target: Model) =>
    chain(
      waitFor(1),
      all(
        target.moveBack(0.05, 1.5, easeOutSine),
        target.expand(),
        target.expand(),
        showlight.lookAt(target.getGlobalPosition(), 1.5),
        showlight.moveTo(
          target.getGlobalPosition().clone().add(new Vector3(0, 1, 0)),
          1.5
        ),
        
      )
    );


  yield delay(1, showlight.fadeIn());
  yield highlightTarget(cpu.bp);
  yield* all(
    camera.followWaypoints([bpView], 2.2, {}, easeInSine),
    camera.lookTo(bpPosition, 2.2)
  );

  yield highlightTarget(cpu.sp);
  yield* all(
    camera.followWaypoints([spView], 2.2, {}, easeOutSine),
    camera.lookTo(spPosition, 2.2)
  );

  const cacheEntry = cacheOrbitWaypoints[0];
  yield highlightTarget(cpu.cache);
  yield* all(
    camera.followWaypoints([cacheEntry], 1.8),
    camera.lookTo(cachePosition, 1.8)
  );

  yield delay(1, cpu.ram.moveDOWN(0.1, 1.5));
  yield* camera.followWaypoints(cacheOrbitWaypoints, 6, {
    closed: true,
    includeCurrentPosition: true,
    tension: 0.4,
  });

  yield highlightTarget(cpu.fpu);
  yield* all(
    camera.followWaypoints([fpuView], 3),
    camera.lookTo(fpuPosition, 3)
  );
  yield showlight.fadeOut();

  yield* waitUntil("next");
});
