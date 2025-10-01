import { makeScene2D } from "@motion-canvas/2d";
import { waitUntil } from "@motion-canvas/core";
import { ShaderBackground } from "../components/background";

export default makeScene2D(function* (view) {
  view.fill("#000");
  view.add(<ShaderBackground opacity={0.2} preset="sunset" />);

  yield* waitUntil("begin");

  yield* waitUntil("next");
});
