# NOTES

IDEAS

- thumbnail : Level 0 CPU vs level 5 CPU

## Legend

`[idea]` - represents animation concept relevant for that section

`[2 << 3]` - used for formating

`[this is optional]` - used for any extra info.

verde - used for new insertions in the script

gri - used for removed sections

> *Animations will be featured throughout the entire video, primarily using 3D graphics. Note represent supplementary information.*
> 

## Structure

> fiecare `level` reprezinta un episod. Asa ca voi adauga cateva introduceri.
> 

# SCRIPT

## Fundaments

The CPU is essentially the brain of your computer, or your car, or your fridge,  it’s a fascinating piece of technology which, surprisingly, is not that hard to understand. In its pure form, a CPU might look like this: `[show level 0 CPU, very naive]`. It’s a bit intimidating at first glance, but let’s start with some fundamentals. A CPU’s purpose is to perform a series of operations on the computer’s memory. `[open computer memory]`

The memory of a computer can be understood as a gigantic cell table; each cell contains 8 bits, which we call a byte. What those bits mean is totally interpretable. For example, those bits can represent the binary representation of a number; however, this chunk of cells can actually mean a message. The CPU’s job is to access a byte from your computer and modify it.

To differentiate between different cells in the memory, we give each of them an address, which is represented by a number. Which is denoted in hexadecimal form because it’s a compact manner to store numbers. Computers have absolutely gigantic memory spaces. 

## Level 0 CPU

We already know enough that we can build a primitive CPU which can read a byte from memory, increment it by 1, and store it back. Let’s call it the level 0 CPU. If we take a look inside, it has 3 main components: a Control Unit (CU), an Incremental Unit (IU), and a Memory Controller (MC). If the CPU is the brain of your computer, the CU is the brain of the CPU – its main role is to control the instruction flow within the CPU. The Incremental Unit actually increments an 8-bit number, and the Memory Controller can read and write that number.

The wiring looks like this. As you see, I connected 2 wires from the CPU to the memory storage. Those aren’t called wires; they are actually buses, which are the address bus and the data bus. Via the address bus, the CPU will be able to know which cell has to be updated with the incremented number; the data bus carries the actual number that needs to be modified. The Memory Controller (which, duh, controls the memory) will transfer to the CU the values of the address and data buses.

This sounds good in theory, but it still misses a few key things to actually be considered a CPU. First of all, every CPU needs some kind of internal memory so it actually remembers what it has to do. In our case, the CPU needs to remember two things: a number and a memory address.

So where does it store that? Well, we can dedicate a small area inside the CPU for memory components — this is called the register space, the general purpose registers (GPR). A register is basically a small, super-fast memory built into the CPU. We’ll need two of them: Address Register (AR) to store the address we’re working with, and Value Register (VR) to hold the actual data. We can just hardcode the address.

The Control Unit gives an order to the Memory Controller to read the value from memory. The MC then places that value onto the data bus. When the CU enables the data register to load it, you see the pattern? The CU is like the commander that orders the CPU to work effectively.

Looks like we’re done... but the CPU still doesn’t move. It needs something to drive it — so we hook it up to a clock. In our case, that clock can be as simple as a button. Press it once, and the CPU takes one step forward. `[show finger animation touches the button and the CPU starts the first example]`

Once the button is touched, fascinating magic occurs where the absolute beauty of nature unfolds `[ironic tone to showcase primitivity]`: a number situated at 0x01 increases by one. With the clock in mind,  let’s execute the steps fully: the clock tells the CPU to run, then the CU asks the Memory Controller to... `[circuit awkwardly stops, press the button again]` to read data situated at 0x01 in memory `[stop]` and sets it in VR. `[a less awkward stop, tension releases once the hand touches the button]` After that, the IU increments the value in the register `[hand almost automatically presses the clock again]` and finally the MC sends the register value back to the RAM. The number went from 27 to 28.

What you’ve just learned is the most primitive CPU you could make, I call it the level 0 CPU, but there are 5 more CPU levels coming – some more insane than others. And from the next one, we’re getting started with a real CPU that will compute actual math.

---

Part 2 drops tomorrow, and if you watch from the future, just check the description for the link. As always, see you next time!

## Level 1 CPU

Last time we’ve built the level 0 CPU, which has the ability to increment a number at a fixed memory address. Let us take a step in complexity and create the `[cut]`

The level 1 CPU has the ability to perform arithmetic serial instructions on two 8-bit integers from any location in memory. Already sounds way more complicated, but we’re missing just a few key elements to achieve this level.

First of all, our current CPU can’t actually compute anything besides incrementation — so let me introduce the ALU, or Arithmetic Logic Unit.  This will replace our old Increment unit. It’s a tiny circuit inside the CPU that handles basic arithmetic operations between 8-bit numbers.

To understand what is an ALU more exactly, let’s take a look at the SN74181, the first ALU ever (the first single chip ALU), produced by Texas Instruments. You can pause to see how it works internally, but what’s really important is this table which explains exactly how the CPU works.`[show Texas Instruments SN74181 ALU datasheet. ALU]` This ALU was used for 4bit numbers, in the logic functions column, you can clearly see the operations suported by an ALU chip:  addition, subtraction which is just addition but we’re adding the other number flipped, setting to 0, etc. This chip can compute basic math. 

![image.png](attachment:f32e58a8-bc6e-4a1e-a716-80e22a2f5e69:image.png)

However we’re not going to use this ALU in this series, we’ll use the Peel-181 by BananaLogic, which definetly exists. It follows the same idea as the SN74181 ALU cip but for 8bit numbers and supports multiplication and division, but before wiring it, we’re going to explore a bit the ways in which the computers interpret numbers.

### Binary number representation

Usually, we represent 8-bit numbers by this pattern `[show 0 -> 0 1 -> 1 10 -> 2 11 -> 3 ... 256 -> 11111111]`. However, our new CPU should also be able to support negative numbers. Why is that implicit? The subtraction circuit requires negative values. Subtracting B is like adding the two’s complement of B.
Computers see an integer in the following manner: the leftmost bit (as typically used in modern computers) represents the sign bit. It indicates if a number is positive or negative. Let’s visualize this on some numbers.`[show footage from binary video]` As you see, to invert 6, for example, we must invert all of its bits and add 1, because inverting the bits results in -7. Try this in your mind with other examples: to go from 3 to -3, you invert its bits and add 1. 

### Back to CPU

Now back to our level 1 CPU. Besides replacing the IU with an ALU, we’ll also include a few more registers `[dramatically add registers, so they seem overwhelming]`.

Ok, there are quite a few changes over here beisdes the ALU, but don’t get overwhelmed since all of them are logical and necessary. In fact, here is a random list of criteria our Level 1 CPU needs to check:

1. The CPU should support dynamic addresses, which means we are not fixed to a constant address. Think of the registers as the CPU’s own memory, akin to variables in your own code. In the level 0 CPU, we had an address register which was responsible for knowing the address. We’ll substitute it with the instruction register, or IR, which tells the Control Unit two things: what to do and how to do it. For example, an instruction register can store the following byte. The first 4 bits represent the opcode, which is the instruction itself — as you see, each value corresponds to a different operation. The second half represents either a numeric value or a memory address, depending on the instruction. Arithmetic operations such as **ADD** will treat the operand as a number to add to the accumulator, while operations like **JMP** or **STORE** will treat it as a memory address. It’s a compact way to store useful data in a CPU. Even though the Instruction Register belongs to the register space, I’ll place it next to the Control Unit to better illustrate its wiring
2. The final task says the CPU should have the ability to perform multiple arithmetic operations subsequently. For this, we can change the old VR (value register) from before with an ACC or accumulator register. The accumulator is responsible for holding a number. If we want to perform, for example, (3 + 5) / 2, in assembly it might look like this: first, we are storing in the accumulator the number 3 from its memory. Then we increment the accumulator by 5, then we shift the accumulator to the right. That simulates dividing by 2. Then we can store the accumulator in memory.
3. And don’t forget, the CPU needs to take into account what instruction follows next. We store the current instruction address in a register called PC, or Program Counter, which the CU increments by one after each instruction. Of course, incrementing by one means moving to the next instruction in memory because instructions are also held in memory. By the way, this is called a Von Neumann architecture. As you see in this example, we as humans interpret the location 2 as a memory address which we load in the ACC, the CPU doesn’t know which byte represents an actual value or an address, as you notice, JMP is the only instruction that controls where the program counter goes, we can create loops using it.

Hopefully, you understand what is the role of the new registers, which are three: PC, IR, and ACC. Just to be clear, the register size is wider in real CPU, right now we’re using 8 bits for simplicity, we’ll explore more complex CPUs. And finally, I’m tired of the clock that requires manual touch to start the CPU — we’ll replace it with an automatic clock that ticks continuously. Each tick represents a CPU activation.

This is our level 1 CPU. A good start, but from the next CPU we’ll introduce programming features so we can actually run code. Part 3 drops tomorrow, if you’re watching later, you’ll find the link in the description. See you next time!

## Level 2 CPU

Everything we’ve touched so far forms the fundamentals of how CPUs are built; in fact, it actually represents an early to mid-1970s architecture, comparable to the Intel 8008 in complexity.

However, the next few changes we’re about to implement will skyrocket the CPU complexity from the ’70s to the early ’80s. This is the Level 2 CPU. It supports complex instructions with 2 parameters and basically every key feature a CPU needs to support: branching, loops, and more.

Now, first things first, let’s get back to Level 1 and start upgrading it. Since the ALU handles the math related to logic and arithmetic, it should also be the one to *tell us what happened*. Did we just get a zero? Was the result negative? Did it overflow? Those questions seem pretty useless, but they will allow for powerful mechanisms such as loops — you’ll see in a moment.

We’ll answer them by adding something called flags. Think of flags as little light bulbs that the ALU turns on or off depending on the result.

- If a result is **zero**, we light up the **Z flag**.
- If it’s **negative**, flip on the **N flag**.
- If there’s a carry-over that doesn’t fit, the **V flag** indicates overflow. This coincides with the sign changing unusually.
- And just in case we divide by zero, we leave a place for a **D/Z flag** (the control unit should process an error in that case).

These flags live in a small register within the ALU, and the ALU updates them automatically every time an operation happens. They don’t store values — they just give *context*.

We wire the output of the ALU into a flags register, then wire that register into the **Control Unit**, because the CU might need that info later — like deciding to branch or not based on a comparison.

When CU will need the flags info, it can simply get the information from the ALU.

Let’s replace the accumulator with multiple registers within the GPR space. (Which the CU will have direct access to) This will give us the freedom to store multiple variables directly within the CPU, not just one. And now we’re ready to start making this a decently codable CPU `[break the ice]`. I mentioned complex operations with 2 parameters. Currently, our processor’s operation looks like this: `[xxxxyyyy]`. The first 4 bits represent the opcode and the rest represent the operand. For further upgrading our instructions, we’ll suppose the instruction register holds 32 bits. (If you noticed, I vary bit sizes quite often in this series – it’s because I want to focus on the juicy sections of CPU architecture, not the boring bit optimization `[may be inaccurate]`.) We can use the first 8 bits as the opcode, then the modifier bits, and split the last 20 bits evenly for two operands. `[xxxxxxxxyyyyzzzzzzzzzzwwwwwwwwww]` This larger setup gives us freedom to reach bigger memory addresses, by having thicker busses. But wait,  where did those come from? `look at modifier bits`

The modifier bits allow us to customize an instruction by assigning different modes to it. The first bit, which is the **M Immediate Mode** bit, represents whether the second operand is an immediate from memory instead of a register. The destination bit represents whether the result is stored in actual memory instead of a register. The **J**, or Jump flag, indicates whether the following instruction is a jump instruction — we’ll get back to this in a moment. The **C**, or Condition flag, is fundamental: it will execute the instruction only if a certain flag is set to 0.

Triggering any of these flags will dramatically change the operation’s purpose. Here is a list of operations we can fully support:

<aside>
⚠️

 Lista va fi modificata

</aside>

```nasm
LOAD   R1, [0x10]      ; Load value from memory address 0x10 into R1  
STORE  R2, [0x20]      ; Store value from R2 into memory address 0x20  

MOV    R3, R4          ; Copy contents of R4 into R3  
ADD    R1, R2          ; R1 = R1 + R2  
SUB    R4, R5          ; R4 = R4 - R5  

INC    R2              ; Increment R2  
DEC    R0              ; Decrement R0  

AND    R1, R2          ; Bitwise AND: R1 = R1 & R2  
OR     R3, R4          ; Bitwise OR:  R3 = R3 | R4  
XOR    R5, R4          ; Bitwise XOR: R5 = R5 ^ R4  
NOT    R2              ; Bitwise NOT: R7 = ~R2  

CMP    R1, R2          ; Compare R1 - R2, update flags  

JMP    0x30            ; Jump to instruction at address 0x30  

BRGT   0x40            ; Branch if greater than zero  
BREQ   0x42            ; Branch if equal to zero  
BRNEG  0x44            ; Branch if negative  

NOP                   ; No operation  
HLT                   ; Halt the program  
```

Since decoding operation complexity has dramatically increased, we’ll introduce the **DECODE UNIT**, whose entire purpose is to extract the bits correctly from the instruction, communicate the proper context to the Control Unit, and define the meaning of each field.It reads the instruction register, splits the bits into segments like the modifier, source, destination, and opcode, and passes them forward. Think of it as a translator — the instruction itself is just raw bits, and without proper decoding, the CU would have no idea what those bits are supposed to mean. The **decode unit** also has its own personal register space, separated from the GPRs, where it stores the **modifiers**, the opcode, and the source and destination in small registers.
This clean separation allows the CU to focus entirely on execution flow without having to interpret bit fields itself. It’s a fundamental step in scaling towards a more complex CPU architecture.

Actually, let’s play around with those operands. Say we want to add 3 from 0x10 to 5 from 0x11 in memory. First, we load the values into registers. We use the **immediate address flag** to load actual memory, not a register. Without the immediate flag, this example would load from register 2 instead of memory address 2. For value 5, it’s the same as before, but we’re loading from address 3. Then, with all flags disabled, we sum register 0 and register 1 and store the result in the source operand, which is register 0. (This technique of storing within the first operand was used in x86.) Then we can optionally store the R0 result in memory address 4. That’s how addition works.

Let’s check if the final result was greater than 0 now — in which case we’ll increment. Here, we’ll require the flags we defined earlier. The ALU already knows the previous operation resulted in 8. The flags tell us it was neither 0 nor negative, so by checking that both flags are off, we can jump to the part where we add 1.

Let’s try a **while loop**. The **JUMP** instruction is so important here — it directly modifies the Program Counter, allowing us to jump to any instruction we want. Say we want to decrement a value at memory address #10 until it reaches zero. First, we load that value into a register. Then, after each subtraction, the ALU updates the flags. We check the **Zero flag** — if it’s **not** set, we use **JUMP** to go back and repeat the subtraction. Once the Zero flag is set, the condition fails, and we continue forward. That’s how you implement a classic while loop using flags and conditional jumps.

This is the foundation of the operation decoding system in modern CPUs. Of course, today’s CPUs might support more diverse operations (although, as we’ll see in a moment, that doesn’t mean more complex) and far more flags (such as additional addressing modes for smoother communication). At the moment, we only support the immediate mode. But I think it’s a good base for now, and we’re ready to start optimizing the CPU memory-fetching process to support a call stack for functions and integrate floating-point number arithmetic.

## Level 3 CPU

![IMG_8641.jpeg](attachment:92d445fb-f9f1-4e09-81ca-229fa87e2c9a:IMG_8641.jpeg)

I present to you the Level 3 CPU — **optimized to run much faster than its predecessors**. Its key features are these: `[stack pointer registers, cache, floating point operations]`. But before we dive in, let me walk you through a bit of history. `[cinematic old-school vibe, old music]`

### FPU

In the early days, floating-point math wasn’t required in general CPUs. When needed, it was integrated into the ALU. The ALU had three main components: the logic unit, the arithmetic unit (for integers), and the FPU — the Floating Point Unit — designed specifically for decimal number operations.

However, since their circuits were so different — and their registers and flags required different bit widths — the FPU was eventually separated. CPUs started handling calculations through both an ALU chip and an FPU chip. So the key difference? **FPU registers and flags operate on much larger bit sizes**. Some floats take 32 bits, others 64, even 128.

In our CPU, we can wire the FPU chip just as we did the ALU chip. The FPU chip will also have some dedicated registers, just like the ALU controls the GPRs.

### STACK HANDLING

A CPU should be capable of handling stacks. A stack is the memory reserved by a function for it to run. In essence, a stack is defined by a pointer to the top, and it grows downward to occupy memory as needed. This works in the context of virtual memory, where memory can be remapped anywhere in RAM and still act as if it were contiguous — but that’s a topic for another video.

Stack sizes used to be fixed back in the day when virtual memory wasn’t yet implemented. Anyway, back to the point: a stack represents a chunk of memory, and a CPU should be able to switch between the caller’s stack and the callee’s stack — just like when functions call each other.

The CPU handles this with two registers and a small amount of logic. The BP (Base Pointer) represents the start of the stack, while the SP (Stack Pointer) represents the current top of the stack. As SP moves downward, the stack size increases.

To support functions, the CPU will include two more instructions: `CALL [addr]` and `RET`. In essence, `CALL` pushes the current Program Counter onto the stack, then jumps to `addr`. `RET` retrieves the return address from the stack and sets the PC back to it. It also restores the previous base pointer. The `RET` will basically reverse what `CALL` just did.

This is pretty much useless without supporting local variables inside a stack. We need 2 more instructions: `PUSH R` and `POP R`. PUSH decrements SP and stores the contents of register R at SP. POP loads the value at SP into register R and increments SP. Again, they are a function pair that act in contrast.

Let’s try this logic out in this assembly example.

```nasm

; --- Main Program ---
PUSH R0         ; Push first number (e.g. 3)
PUSH R1         ; Push second number (e.g. 5)

CALL ADD_FN     ; Call function: expects two args on stack

POP R2          ; Pop result from stack into R2
HLT             ; Done

; --- Function: ADD_FN ---
ADD_FN:
PUSH BP         ; Save old BP
MOV BP, SP      ; Set BP to new frame base

MOV R3, [BP + 2] ; Get first arg
MOV R4, [BP + 1] ; Get second arg
ADD R3, R4      ; R3 = R3 + R4

MOV [BP + 2], R3 ; Store result where first arg was

MOV SP, BP      ; Reset SP
POP BP          ; Restore old BP
RET

```

We assume register 0 stores 3 and register 1 stores 5. We first push the registers onto the stack as parameters and then call the function. We save the old BP and update it to a new stack base. We read the values from the stack (which are 3 and 5) and perform an addition before we store the final result where the first argument was. We reset the SP and restore the old BP before the RET instruction. To access the result, we simply POP it from the top of the stack.

### CACHE

Let me pause here for a moment and ask you something. Why is the CPU slow? Pause the video and think about whatever argument you can — maybe it’s limited by electricity flow, maybe by size, maybe by clock ticks. In theory, whatever you answered is true, but what wastes most time is fetching data from memory. The thing is that this doesn’t need to slow the CPU down. There’s a simple fix involving one component which would boost performance … a lot! That is a cache hierarchy or a caching system.

A cache is a system that saves data from RAM that is frequently used by the CPU, as a backup so the CPU doesn’t need to fetch it from the actual memory. You might think that it’s basically the same process – you’re searching for the same data, but in another manner. Picture yourself: you want to pick up a notebook. If it’s in the same room as you, it will take, what, 30 seconds to pick it up? But what if you didn’t have a notebook in the first place? You would go to a shopping center to buy one. Even if you know exactly where to find the notebook, the time it takes to arrive at the shop, buy it, and come back home is a lot of time.

The same applies to your CPU — it’s much easier to find data in the cache (essentially just a dedicated memory inside the CPU) than in the main memory itself. You can think of a cache as a bigger, smarter register.

A cache architecture is built on two principles:

- **Spatial locality** – If you access an address, you’ll probably access its neighbors soon.
- **Temporal locality** – If you access an address once, you’ll likely access it again shortly.

Therefore, a cache is structured into *cache lines*. A cache line might be 128 or 256 bits, depending on the CPU manufacturer. Let’s assume 128-bit cache lines for our case. If we store an array, the cache doesn’t just save the first element — it grabs the next 3 as well, since they’ll probably be needed.

The lines themselves are organized into a hierarchy of *ways*, making it easier for the cache to find a specific one. A CPU finds a line by using a direct mapping algorithm, which is a relatively difficult subject that might need a video on its own. But in short, many chunks from RAM are associated with a single line in a cache; to prevent overloads if two chunks want to use the same line, we need to readdress them.

Once initialized, a cache is empty — so it will need to fetch memory anyway when it starts. The CPU first searches for the memory address in the cache. If it’s missing, it fetches it from RAM and adds it to the cache. This is called a *cache miss*.

Next time it needs that same address, it’ll find it directly in the cache — that’s called a *cache hit*. The Control Unit adds new lines to the cache using almost the same process as searching. Our goal is to maximize the chance of cache hits. Of course, cache misses can’t be avoided completely since memory needs to be loaded eventually — but we’ll optimize as much as we can.

If you wonder how the CPU removes a cache line (for example when the cache is full and needs to allocate new space), there is actually no single standard way. Every CPU uses a different algorithm for its replacement policy. Here are a couple of popular ones which are self-explanatory:

- **Most Recently Used (MRU)**
- **Least Frequently Used (LFU)**
- **Least Recently Used (LRU)**
- **Most Frequently Used (MFU)**
- **Pseudorandom** (which basically removes a random line)
- **Hybrid strategies** (combining several techniques)
- **etc**

And finally, the cache organizes itself into 2 components: the data cache and the instruction cache. The data cache stores frequently accessed memory values, while the instruction cache holds recently used instructions. This lets the CPU reuse both data and instructions efficiently. Why are they separated? Because the cache size is pretty limited, and eventually unorganized overlaps of data and instruction addresses will cause headaches.

Well, I went on a rant with this cache theory (hope it didn’t bore you too much), but we’re ready to implement it in the level 3 CPU. In our design, it is not difficult at all. It goes right between the Memory Controller and memory.

### Finishing the Level 3 CPU

There’s one more thing left. If you’ve paid attention, the CPU should support 18 operations but logically it is limited to 16 because of the way instructions are handled. Unfortunately, the way we could support more operations is by sacrificing one of the flag bits or reducing operand size, but it’s really not ideal. Our only option is to reconsider the instruction **format** size. We’ll again theoretically increase it to 32 bits, and we’re going to support `nnnnnnnnffffaaaaaaaaaabbbbbbbbb` where the first 8 bits represent the opcode, the next 4 represent flags, and the next 16 represent the operands. Of course, these changes also require a thicker bus to transfer the instruction data of at least 32 bits.

And with all of this integrated, we can call this processor a level 3 CPU, which is comparable to a late ’80s to early ’90s design. But from here, things only get crazier. We still haven’t made use of our most powerful technique yet, which is parallelism.

## Level 4 CPU

![IMG_8642.jpeg](attachment:95e2fcaa-be08-4535-9c06-901b90d0c3bb:IMG_8642.jpeg)

### Parallelism

Parallelism is classified into two categories:

1. Explicit parallelism, which generally requires duplicated hardware to run multiple operations simultaneously — think of a multicore CPU.
2. Implicit parallelism describes concepts such as complex pipelining, superscalar execution, or out-of-order processing. These techniques “fake” true parallelism by maximizing hardware utilization without actually duplicating components.

The complexity of these techniques varies, but generally explicit parallelism is easier to implement on paper.

Consider a multicore CPU. This is an architecture that distributes tasks evenly (or unevenly, by some kind of categorization) across multiple cores. Each core can be thought of as a complete CPU like the one we’ve already built. Thus, the entire philosophy behind multicore CPU is merging multiple CPUs into one.

Sounds good, but this also implies a few modifications.

The cache system also changes slightly. Each core has access to its own private cache, usually organized in multiple levels:

- L1 cache – the smallest and fastest, closest to the core
- L2 cache – larger than L1 but slightly slower
- L3 cache – shared between multiple cores

In some architectures, paired cores share a common L3 cache, and groups of L3s may even connect to a global L4 cache.

Now any data stored in a lower-level cache (like L1) is also propagated upwards through higher levels, so other cores can find it faster. Searching in this cache hierarchy works by the same logic as before, but a core searches in higher and higher levels if it doesn’t find the data it’s looking for. Once it finds it, it’s saved within the core’s private L1 and L2.

This entire hierarchical design efficiently saves frequently used data across multiple cores. That’s the power of caching data.

### Constructing the Level 4 CPU

That was the theory. Now, applying what we’ve learned from explicit parallelism, we can compose our level 4 CPU of multiple interconnected level 3 CPUs. Only with this change, the CPU is already at ano- Oh wait, what is that? Two more tasks it needs to fulfill? “I/O port-based support” and “Vector Processing”? Let’s start with the first one.

### Vector Processing

As time went on, computers focused on rendering graphics, which is a heavy task that implies a lot of color and vector manipulation. Let’s consider a color per se. It’s a unit composed of 4 channels: R, G, B, and A. A channel is a float ranging from 0 to 1. In most tasks, like increasing one of the channels or increasing the luminosity of a color `[perform addition and mul (.5, .7, .3, 1) + (.3, .2, .1, 0), (1, .4, .5, 1) * .4]`, there’s no dependency between channels. That means in addition, you offset each element in vector A with a corresponding member from B; when multiplying a number, you scale each element independently. Those tasks became extremely frequent once video processing and other features became necessary. There was a high demand for a new way of computing multiple data at once.

A new chip was introduced in the industry, which set the standard for the following years: the Vector Processing Unit, or VPU chip. This unit performs parallel operations on multiple numbers at a time — it can be 4, 2, or 64 numbers, that isn’t relevant. What’s important to grasp here is that it performs multiple operations at once. It also supports floating-point numbers (some even integers), which, as a fun fact, is the reason why today’s CPU can switch between int and float so fast — it’s because they are integrated within one chip. FPU chips have been completely replaced by a VPU, which is simply superior for its purpose.

Now, on the technical side, the VPU contains huge registers ranging from 128-bit to 512-bit (like in AVX or NEON) because they are meant to store multiple elements, not one. They also require more complex wiring because each vector lane must operate independently, requiring more datapaths. The VPU goes by the SIMD principle, which means Single Instruction, Multiple Data — because it applies the same operation across multiple data points. Thus, the functional units for adding, multiplying, or whatever else it has are more complex than ALUs, for example. When it comes to wiring the VPU, it requires a parallel bus for each vector lane.

We’ll also need to add new instruction sets such as:

- **VADD** for adding two vectors `[show example]`
- **VSUB** for subtracting two vectors `[show example]`
- and more (VMULL, VDIV, etc.)

This is vector processing.

### Port-Based I/O

We’ve had one more task to cover, which is supporting ports for devices. With this, the CPU will support keyboards, mice, network cards, and other devices that are not part of memory but need to exchange data. We need to find a way to read from and write to them.

So far, a CPU’s purpose was communicating with the main memory. In that manner, it was able to access instructions, data values, and even memory-mapped input and output devices (which were devices stored in memory, basically). We accessed RAM using addresses, but port-based I/O uses a separate address space — a non-memory-mapped address space.

To support this, we need new write/read operations that don’t work on RAM but on ports. We call them with **IN** or **OUT** operands. Here are a few examples of moving data from registers to ports:

```nasm

IN  AL, 0x60    ; Read from keyboard controller port
OUT 0x3F8, AL   ; Send data to serial port COM1

```

But what is a port, exactly? It’s just an address used as an identifier for an I/O register. It isn’t a physical component, just an ID. A port’s purpose is to identify a register from another device and allow the CPU to communicate with it.

To do that, the CPU will send the data it wants to read or modify via the address bus with special control signals. The motherboard (or whatever chip holds the connection itself) will receive the address, and if it matches the port a device listens to, that device responds. This is the basis of port-based input/output.

### Back to CPU

This is the Level 4 architecture. With integrated parallelism, vector processing, and I/O port-based integration, it compares to a late ’90s level of complexity. But we’re still far from Level 5’s capabilities.

## Level 5

But before anything, let’s get back to parallelism.

### Back to Parallelism

Remember the two categories? Implicit and Explicit parallelism. Explicit parallelism uses actual duplicate hardware to perform multiple tasks at once; implicit parallelism makes full use of hardware potential. We’ll focus on the following 4 optimizations, where each one serves a key purpose. If you understand those 4, you officially know how early- to mid-2000s CPUs work — which, unfortunately, is probably the most you’ll ever get to know about CPUs (more about this at the end).

### **Pipelining**

The first key optimization in implicit parallelism is **pipelining**. This technique was first implemented in the ’50s or ’60s, actually. Its purpose is to increase throughput by overlapping instruction phases.

Let’s clarify something: in pipelining, an instruction isn’t *really* an instruction. In the context of pipelining, we must decompose instructions into atomic operations that are fundamental and very fast to compute. Follow along — you’ll see in a second why. Those steps vary in number, generally from 5 to 30, but we can name them as Fetch, Decode, Execute, Memory access, and Register Write-Back. Each step can be viewed as an atomic instruction.

1. **Fetch** is the process of reading the instruction that’s about to get executed from the memory location pointed to by the instruction register.
2. **Decode** is the process of extracting the opcode, flags, and operands.
3. **Execute** – based on the opcode, the appropriate functional unit will be selected (this can be an ALU, FPU, MC, or whatever). The functional unit will execute the operation.
4. **Memory access** is a step that happens if the instruction requires reading or writing memory; the MC performs this operation now.
5. **Register write-back** is the process where the functional unit that performed the execution writes the results back into the destination register.

Again, all of these small steps together define a full instruction. What’s essential to see here is that each step involves a different unit or at least a different part of the execution process, which means if we “fetch” some data then we can “write-back” some other data. You see the pattern? When one small step happens, it’s isolated from other small steps — nothing stops us from executing instruction A while instruction B’s output is sent to memory.

Let’s actually graph everything so we understand better. We’ll call FETCH, DECODE, EXEC, MEM, and WB the instruction stages. We assume each stage triggers on a clock cycle.

| ⏰ **Clock Cycle** | **FETCH** | **DECODE** | **EXEC** | **MEM** | **WB** |
| --- | --- | --- | --- | --- | --- |
| 1️⃣ | A |  |  |  |  |
| 2️⃣ | B | A |  |  |  |
| 3️⃣ | C | B | A |  |  |
| 4️⃣ | D | C | B | A |  |
| 5️⃣ | E | D | C | B | A |
| 6️⃣ | F | E | D | C | B |
| 7️⃣ | G | F | E | D | C |

Actually, we can visualize this on our CPU if we split up the functional units a bit. Let’s include a Fetch Unit (which previously was part of Decode) and a Write-Back Unit (which was previously handled by the Control Unit). `[go through multiple cycles; each used unit will light up to an instruction’s color that changes every tick (if A used the ALU, then ALU will be represented by A’s color for that tick, e.g., RED)]`. As we see, at any time every component of the CPU is working — this is full productivity, or pipelining.

A key idea here is that all of the stages will wait until the longest one is completed. That’s why some pipelines can divide an instruction into 30 smaller ones by subdividing our current stages. You can’t do that forever, because the higher the number of stages, the higher the overall instruction latency will be. `[show latency definition in a corner]`.

**`*Pipeline latency** is the **total time it takes for a single instruction to pass through all stages of the pipeline**, from fetch to write-back. If a CPU has a 5-stage pipeline and each stage takes 1 cycle, the latency is **5 cycles** — even though new instructions start every cycle. Don’t confuse it with **throughput** (how often results are produced). Latency is about how long **one instruction** takes from start to finish.`

Sometimes a CPU can’t issue a new instruction on a particular cycle — this is called a **stall**. Visually, a stall looks like this; it’s just like a bubble in the CPU execution.

| ⏰ **Clock Cycle** | **FETCH** | **DECODE** | **EXEC** | **MEM** | **WB** |
| --- | --- | --- | --- | --- | --- |
| 1️⃣ | A |  |  |  |  |
| 2️⃣ |  | A |  |  |  |
| 3️⃣ | C |  | A |  |  |
| 4️⃣ | D | C |  | A |  |
| 5️⃣ | E | D | C |  | A |
| 6️⃣ | F | E | D | C |  |
| 7️⃣ | G | F | E | D | C |

A bubble like this might appear from **data dependencies** — basically, if we execute `a = 2 * 3` and `b = a + 4`. In order to execute the instruction for calculating b, we need to calculate a first, thus we have to wait for that instruction to finish, which creates a gigantic bubble or pipeline stall. Bubbles also get triggered from **control dependencies** (which themselves are triggered by branching) and **resource dependencies**, which appear when two instructions require the same hardware resource at the same time but the CPU can’t provide it to both.

| ⏰ **Clock Cycle** | **FETCH** | **DECODE** | **EXEC** | **MEM** | **WB** |
| --- | --- | --- | --- | --- | --- |
| 1️⃣ | A |  |  |  |  |
| 2️⃣ |  | A |  |  |  |
| 3️⃣ |  |  | A |  |  |
| 4️⃣ |  |  |  | A |  |
| 5️⃣ |  |  |  |  | A |
| 6️⃣ | B |  |  |  |  |
| 7️⃣ | C | B |  |  |  |

Those three causes for stalls correspond to the following three optimizations.

### Data dependencies

The second optimization is acquired via several techniques. In the ’70s, register renaming became a thing; forwarding in the ’80s; and out-of-order execution in the ’90s. We’ll focus on the OoOE technique in this video. What does it do? Well, to avoid data dependencies, it actually reorders the instructions from machine code so it executes the next instruction while the one that caused the dependency waits. Does it sound dangerous? It absolutely is (or not quite) — it’s a great optimization, but this also implies that your CPU might reorder your instructions in a wrong way. In serial programs, there isn’t much to worry about; however, in programs that make use of parallelism and multi-threading synchronization, this is a serious cause of bugs. I actually covered how to fix those bugs in another video. `[show video about lock-based programming]`. Now, truthfully, CPUs are pretty good at this, but you must be aware that they can make serious errors when optimizing your code. It’s always a good idea to just check the disassembly code or do the reordering by hand so you don’t have to worry about the CPU getting it wrong. Anyway, that was a boring bit for the nerds — let’s continue! This is out-of-order execution.

### Branch dependencies

The third optimization occurs when the next instruction is based on a condition whose outcome you don’t know yet. Now I will let you guess: what’s the optimization step? `[show, ironically, a pressured time clock just like on a millionaire show where 4 answers are on screen, all of them identical and saying "completely ignore branching"]`. Oh my god, you’re such a genius, correct! In the ’80s, this was a very common concept — **static prediction**, where the CPU just assumes the branch outcome and executes the next instruction anyway. It sounds primitive, but hey, it gets the job done. This was the way early CPUs avoided those dependencies.

As time went on, more advanced techniques started to pop up. The CPU didn’t just assume the good or bad case of the branch was true; it started to guess. This appeared via several complex techniques like avoiding forward branches and pre-executing backward branches — basically prioritizing loops. However, as time went on, new hardware for branch prediction was created: the branch predictor, which analyzes common patterns in order to determine which branch will execute.

Of course, from a programmer’s side, the best way to avoid branch dependencies is by avoiding branches — which is something that you can do more often than you think using bitwise operators (generally, which I also made a video about). This is a form of speculative branch prediction.

### Resource dependencies

The fourth and final optimization refers to superscalar designs in CPUs. They are a way to combat the resource dependency which occurs when two instructions require the same hardware. Again, I will let you guess `[again, pressured clock with 4 identical answers: "duplicate hardware"]`. Yes! Duplicating hardware. But wait! Wasn’t this the concept of explicit parallelism? Why is it considered implicit? Well, I lied a bit regarding the definition of implicit vs. explicit parallelism. Implicit parallelism refers to optimizations that the CPU handles without assistance from the OS or programmer, whereas explicit parallelism refers to optimizations that the programmer can assist with using mechanisms such as threads, fibers, etc. But can’t the programmer also assist in implicit parallelism? Well, yes! But those are two opposite concepts which, as always, shouldn’t be taken literally because there is no fine line defining them. You can view implicit and explicit concepts as a way to organize techniques, but not to rigidly define them — and by the way, this applies to almost every concept in computer science.

Uhm, what was I saying? Oh yeah, superscalar designs. Here is how this design solved the issue of two operations needing an ALU `[copy-paste ironic animation]`: we clone it. This might seem easy to understand on paper, but in reality this involves more complex mechanisms for scheduling instructions to different chips on the CPU. We can actually consider this as a chip: the IS (Instruction Scheduler), whose purpose is to know which instruction uses which chip.

In actual superscalar designs, one might look like this: `[present superscalar design]`. As you see, most of the hardware is duplicated and handles two instructions at once; in theory this also handles two instructions per cycle. A two-way superscalar CPU graph might look like this:

| ⏰ **Clock Cycle** | **F0** | **F1** | **D0** | **D1** | **E0** | **E1** | **M0** | **M1** | **WB0** | **WB1** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1️⃣ | A | B |  |  |  |  |  |  |  |  |
| 2️⃣ | C | D | A | B |  |  |  |  |  |  |
| 3️⃣ | E | F | C | D | A | B |  |  |  |  |
| 4️⃣ | G | H | E | F | C | D | A | B |  |  |
| 5️⃣ | I | J | G | H | E | F | C | D | A | B |
| 6️⃣ | K | L | I | J | G | H | E | F | C | D |
| 7️⃣ | M | N | K | L | I | J | G | H | E | F |

I think it’s fascinating that we got this far with just a few optimizations. Remember, our CPU execution graph initially was this:

| ⏰ **Clock Cycle** | **FETCH** | **DECODE** | **EXEC** | **MEM** | **WB** |
| --- | --- | --- | --- | --- | --- |
| 1️⃣ | A |  |  |  |  |
| 2️⃣ |  | A |  |  |  |
| 3️⃣ |  |  | A |  |  |
| 4️⃣ |  |  |  | A |  |
| 5️⃣ |  |  |  |  | A |
| 6️⃣ | B |  |  |  |  |
| 7️⃣ |  | B |  |  |  |

The CPU is now like… 5× as fast? At least.

However, in the real world we can’t just add more hardware that easily like we do in this abstract CPU designing video — we have to take into account real estate (chip area). Each operand has different wiring to a different unit; if we actually make a practical superscalar CPU, we’ll find out that we need to reduce the wiring significantly in order for more units to exist. Most superscalar designs have become RISC processors (Reduced Instruction Set Computing) – they only support really primitive tasks with low wiring. However, I will skip this side aspect for the educational purpose of the video. `[optional scene]`

I don’t want you to think that superscalar designs are just a copy-and-paste of hardware. Not really — that was just a simplification of the process. In reality, this concept deserves an episode on its own because its complexity skyrockets when optimizing this far. But for the purpose of this video, we’ll take a look from a high-level perspective of the CPU architecture. This is a superscalar CPU.

### Back to Level 5

After all of this theory of optimization, we can start rebuilding the CPU from where we left off on level 4. Let’s remember: we started with a pipeline; we will integrate units for fetching, decoding, and writing back instructions. Then we’ll have a complex scheduler unit that will handle most of the previous CU’s job by deciding what each instruction does, reordering them, and guessing branches. Then we’ll integrate a superscalar design by cloning essential hardware — in this case the VPU, ALU, the write-back units, fetch units, and decode units. With all of these changes, we can zoom back out from the core and see the entire CPU. This is level 5 CPU and unfortunately it’s the most you’ll probably get to know about CPUs. We’re still stuck with a CPU that is stuck in the mid-2000s.

## Why you’ll never get to know more

Newer techniques are often very specific and don’t give huge performance boosts. They are complex tweaks. Also, most CPUs nowadays keep their hardware logic private because techniques become proprietary (Intel, AMD, Apple rarely disclose full details) and reverse-engineering them is hard and somewhat pointless. But the thing is that, in the modern day, CPUs don’t determine the speed of a computer, or at least they aren’t the dominant factor. Software optimization is way more important in providing a better experience for users, and this topic is more frequently studied. Also, there is a trendy shift to parallelism where simply more cores or more CPUs mean greater power, because cores at this point in time are extremely hard to optimize further.

## Outro

> 100 words of outro, credits, special thanks, etc Simulation
> 

aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa

aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa

aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa

aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa

aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa aaa aaaaa