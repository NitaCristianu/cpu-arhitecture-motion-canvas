from pathlib import Path
import re
path = Path(r"src/scenes/level-3-cpu-scene-6.tsx")
text = path.read_text()
pattern = re.compile(r"const INITIAL_STACK_STATE = \[(?:\n.+?)+?\] as const;", re.DOTALL)
match = pattern.search(text)
if not match:
    raise SystemExit('Initial state block not found')
replacement = "const INITIAL_STACK_STATE = [\n  { value: \"1010110010010110\", label: \"previous frame\" },\n  { value: \"1110010101101001\", label: \"\" },\n  { value: \"0000100100010100\", label: \"\" },\n  { value: \"0101011100110001\", label: \"\" },\n  { value: \"0011011001111100\", label: \"\" },\n  { value: \"1000110000101110\", label: \"\" },\n] as const;"
text = text[:match.start()] + replacement + text[match.end():]
path.write_text(text)
