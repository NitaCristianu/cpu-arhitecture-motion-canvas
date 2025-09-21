// from prev video
import { Gradient, initial, Rect, RectProps, signal, Txt, TxtProps, View2D } from "@motion-canvas/2d";
import { all, createEffect, createSignal, easeInCubic, easeOutCubic, range, sequence, SignalValue, SimpleSignal, spawn, useLogger } from "@motion-canvas/core";

// a bit group is half byte (4bits)
export interface BitnumberProps extends RectProps {
    number?: SignalValue<number>,
    bitgroups?: SignalValue<number>,
    bits?: SignalValue<number>,
    showDecimal?: SignalValue<number>, // 1 is true, 0 is false
    showHex?: SignalValue<number>, // 1 is true, 0 is false
    initialVisibility?: boolean
}

function getBinary(decimal: number, bits_amount = 8) {
    const binary: number[] = new Array(bits_amount).fill(0);

    for (let i = 0; i < bits_amount; i++)
        binary[bits_amount - 1 - i] = (decimal >> i) & 1;

    return binary
}

export class Bitnumber extends Rect {

    @initial(1)
    @signal()
    public declare readonly bits: SimpleSignal<number, this>;
    
    @initial(4)
    @signal()
    public declare readonly bitgroups: SimpleSignal<number, this>;

    @initial(0)
    @signal()
    public declare readonly number: SimpleSignal<number, this>;

    @initial(0)
    @signal()
    public declare readonly showDecimal: SimpleSignal<number, this>;

    @initial(0)
    @signal()
    public declare readonly showHex: SimpleSignal<number, this>;

    private decimalScalar = createSignal<number>(0);
    private hexScalar = createSignal<number>(0);
    private i: number = 0;
    private visible: boolean = true;
    public boxes: Rect[] = [];

    public constructor(props?: BitnumberProps) {
        super({
            layout: true,
            alignItems: 'center',
            gap: 10,
            ...props
        });
        if(props.bitgroups && !props.bits){
            this.bits(Math.floor(this.bitgroups()*4));
        }
        this.add(<Rect
            marginRight={() => this.showDecimal() ? 50 + 100 * Math.min(this.showDecimal(), 1) : 50}
            height={160}
            alignContent={'center'}
            justifyContent={'end'}
            width={() => this.hexScalar() * this.showHex() * 80}
        >
            <Txt
                marginTop={30}
                text={() => `${this.number().toString(16)} = `}
                scale={() => this.hexScalar() * this.showHex()}
                fontSize={80}
                fontFamily={"Fira Code"}
                fill={"rgba(243, 240, 65, 1)"}
                shadowColor={"rgba(223, 238, 85, 1)"}
                shadowBlur={40}
            />
        </Rect>);
        this.add(<Rect
            marginRight={50}
            height={160}
            alignContent={'center'}
            justifyContent={'end'}
            width={() => this.decimalScalar() * this.showDecimal() * 80}
        >
            <Txt
                marginTop={30}
                text={() => `${this.number()} = `}
                scale={() => this.decimalScalar() * this.showDecimal()}
                fontSize={80}
                fontFamily={"Poppins"}
                fill={"rgba(243, 240, 65, 1)"}
                shadowColor={"rgba(223, 238, 85, 1)"}
                shadowBlur={40}
            />
        </Rect>);
        this.visible = props.initialVisibility ? true : false;
        this.load()
    }

    public *pop(t: number = .6) {
        if (this.visible)
            yield* sequence(
                .2,
                this.decimalScalar(0, t, easeInCubic),
                this.hexScalar(0, t, easeInCubic),
                all(
                    ...this.boxes.map(box => box.scale(0, t, easeInCubic)),
                    ...this.boxes.flatMap((box: Rect) => (box.children().map(child => child.opacity(0, t, easeInCubic)))),
                ),
            );
        else
            yield* sequence(
                .2,
                all(
                    ...this.boxes.map(box => box.scale(1, t, easeOutCubic)),
                    ...this.boxes.flatMap((box: Rect) => (box.children().map(child => child.opacity(1, t, easeOutCubic)))),
                ),
                this.decimalScalar(1, t * 3 / 4, easeOutCubic),
                this.hexScalar(1, t * 3 / 4, easeOutCubic),
            );

        this.visible = !this.visible;
    }

    public shift(val: number = 1) {
        var x = this.number();
        if (val > 0)
            x >>= val;
        else
            x <<= -val;

        this.load(x);
    }

    public load(newval?: number, t = .2) {
        if (newval != this.number()) {
            spawn(this.children()[0].opacity(0.2, t/2 + .02).do(() => this.number(newval)).to(1, t));
            spawn(this.children()[1].opacity(0.2, t/2 + .02).do(() => this.number(newval)).to(1, t));
        }
        const decimal = newval ? newval : (this.number ? this.number() : 0);
        const bits_amount = Math.floor(this.bits() * 1);
        const binary = getBinary(decimal, bits_amount);
        this.i = 0;

        for (; this.i < bits_amount; this.i++) {
            var box: Rect;
            if (this.i >= this.boxes.length) {
                box = (<Rect
                    stroke={new Gradient({
                        fromY: -100,
                        toY: 100,
                        stops: [
                            { offset: 0, color: "#fff3" },
                            { offset: 0.5, color: "#fff" },
                            { offset: 1, color: "#fff3" },
                        ]
                    })}
                    lineWidth={3}
                    radius={16}
                    justifyContent={'start'}
                    alignContent={'center'}
                    paddingLeft={50}
                    scale={0}
                    size={160}
                    ratio={1}
                    direction={'column'}
                    clip
                />) as Rect;
                box.add(<Txt
                    text={binary[this.i].toFixed(0)}
                    fontSize={100}
                    fontFamily={"Fira Code"}
                    fill={"white"}
                    marginTop={23}
                    opacity={0}
                />);
                this.boxes.push(box);
                this.add(box);

                if (this.visible) {
                    spawn(box.scale(t*5, .8));
                    spawn(box.children()[0].opacity(t*5, 1));
                }
            } else {
                box = this.boxes[this.i];
                const txt = box.children()[0] as Txt;
                const bit = binary[this.i];

                if (txt.text() != bit.toFixed(0)) {
                    const txt2 = txt.clone();
                    box.add(txt2);
                    txt2.text(`${bit}`);
                    spawn(txt.margin.top(-123, t*2).do(() => txt.remove()));
                }

            }
        }
        for (; this.i > bits_amount; this.i--) {
            const box = this.boxes.pop()!;
            spawn(box.size(0, t*4).do(() => box.remove()));
        }
    }

}