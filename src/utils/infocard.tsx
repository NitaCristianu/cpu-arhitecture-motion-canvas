import { Glass, GlassProps } from "../components/GlassRect";
import { RectProps, Txt, View2D } from "@motion-canvas/2d";
import { createRef, SimpleSignal } from "@motion-canvas/core";

/**
 * Spawns a glassy card that can be animated later.
 *
 * @param text       initial string
 * @param fontSize   override (default 120)
 * @returns { node, glass, label } –
 *          `node` is the JSX element to add to the view
 *          `glass` / `label` are Motion-Canvas refs you can animate
 */
export function createInfoCard(
  text: string,
  {
    fontSize = 100,
    width = 1000,
    height = 200,
    noShader = false,
    props = {},
  }: {
    fontSize?: number;
    width?: number | SimpleSignal<number>;
    height?: SimpleSignal<number> | number;
    noShader? : boolean,
    props?: GlassProps;
  } = {},
  view?: View2D
) {
  const glass = createRef<Glass>();
  const label = createRef<Txt>();

  const node = (
    <Glass
      ref={glass}
      radius={32}
      lightness={0.5}
      width={width}
      height={height}
      zIndex={2}
      disableShader={noShader}
      {...props}
    >
      <Txt
        fill={"#ccc"}
        fontSize={fontSize}
        fontFamily={"Poppins"}
        shadowBlur={20}
        shadowColor={"#000"}
        fontWeight={500}
        zIndex={1}
        text={text}
      />
    </Glass>
  ) as Glass;
  if (noShader){
    node.shadowBlur(20);
    node.shadowColor("#fff5")
  }

  view?.add(node);
  // expose helpers
  return { node, glass, label };
}
