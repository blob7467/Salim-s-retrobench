.syntax unified
.arch armv7-a
.arm
.text
.globl _main
.align 2
_main:
    // Setup stack frame
    push {r4, r5, r7, lr}
    add r7, sp, #8

    // Infinite loop or sleep loop so the process stays alive on iOS
loop:
    // sleep(1) via nanosleep or pause
    mov r0, #1
    // Loop with low power WFI or sleep
    b loop

    mov r0, #0
    pop {r4, r5, r7, pc}
