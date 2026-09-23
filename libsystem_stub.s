.syntax unified
.thumb
.globl dyld_stub_binder
.thumb_func
dyld_stub_binder:
    bx lr

.globl ___stack_chk_guard
___stack_chk_guard:
    .long 0

.globl ___stack_chk_fail
.thumb_func
___stack_chk_fail:
    bx lr
