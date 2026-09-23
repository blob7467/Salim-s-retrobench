.syntax unified
.thumb

.globl _main
.thumb_func
_main:
    push {r4, lr}
    movs r0, #0
    movs r1, #0
    movs r2, #0
    movs r3, #0
    bl _UIApplicationMain
    pop {r4, pc}

.globl _start
.thumb_func
_start:
    bl _main
    movs r7, #1
    svc #0x80
