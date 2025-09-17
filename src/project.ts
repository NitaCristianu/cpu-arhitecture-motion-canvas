import { makeProject } from "@motion-canvas/core";
import "./global.css";

import example from "./scenes/example?scene";
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
import level2CpuScene from "./scenes/level-2-cpu-scene?scene";

export default makeProject({
  scenes: [
    // example,
    // introScene,
    // ramConcept,
    // level0CpuScene1,
    // level0CpuScene2,
    // registerIntroduction,
    // level1CpuScene1,
    // level1CpuScene2,
    // level1CpuScene3,
    // level1CpuScene4,
    // level1CpuScene5,
    // level1CpuScene6,
    // level1CpuScene7,
    level2CpuScene
  ],
  experimentalFeatures: true,
});
