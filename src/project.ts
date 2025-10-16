import { makeProject } from "@motion-canvas/core";
import "./global.css";

import example from "./scenes/example?scene";
import devModelInspector from "./scenes/dev-model-inspector?scene";
import introScene from "./scenes/intro-scene?scene";
import ramConcept from "./scenes/ram-concept?scene";
import level0CpuScene1 from "./scenes/level-0-cpu-scene-1?scene";
import level0CpuScene2 from "./scenes/level-0-cpu-scene-2?scene";
import registerIntroduction from "./scenes/register-introduction?scene";
import level1CpuScene1 from "./scenes/level-1-cpu-scene-1?scene";
import level1CpuScene2 from "./scenes/level-1-cpu-scene-2?scene";
import level1CpuScene3 from "./scenes/level-1-cpu-scene-3?scene";
import level1CpuScene4 from "./scenes/level-1-cpu-scene-4?scene";
import level1CpuScene5 from "./scenes/level-1-cpu-scene-5?scene";
import level1CpuScene6 from "./scenes/level-1-cpu-scene-6?scene";
import level1CpuScene7 from "./scenes/level-1-cpu-scene-7?scene";
import level2CpuScene1 from "./scenes/level-2-cpu-scene-1?scene";
import level2CpuScene2 from "./scenes/level-2-cpu-scene-2?scene";
import level2CpuScene3 from "./scenes/level-2-cpu-scene-3?scene";
import level2CpuScene4 from "./scenes/level-2-cpu-scene-4?scene";
import level3CpuScene1 from "./scenes/level-3-cpu-scene-1?scene";
import level3CpuScene2 from "./scenes/level-3-cpu-scene-2?scene";
import level3CpuScene3 from "./scenes/level-3-cpu-scene-3?scene";
import level3CpuScene4 from "./scenes/level-3-cpu-scene-4?scene";
import level3CpuScene5 from "./scenes/level-3-cpu-scene-5?scene";
import level3CpuScene6 from "./scenes/level-3-cpu-scene-6?scene";
import level3CpuScene7 from "./scenes/level-3-cpu-scene-7?scene";
import level3CpuScene8 from "./scenes/level-3-cpu-scene-8?scene";

export default makeProject({
  scenes: [
    example,
    introScene,
    ramConcept,
    level0CpuScene1,
    level0CpuScene2,
    registerIntroduction,
    level1CpuScene1,
    level1CpuScene2,
    level1CpuScene3,
    level1CpuScene4,
    level1CpuScene5,
    level1CpuScene6,
    level1CpuScene7,
    level2CpuScene1,
    level2CpuScene2,
    level2CpuScene3,
    level2CpuScene4,
    level3CpuScene1,
    level3CpuScene2,
    level3CpuScene3,
    level3CpuScene4,
    level3CpuScene5,
    level3CpuScene6,
    level3CpuScene7,
    level3CpuScene8,
    // devModelInspector,
  ],
  experimentalFeatures: true,
});
