import { useState, useEffect } from "react";

const breakpoints = {
    pc: 1280,
    tb: 960,
    sp: 560,
    min: 320,
} as const;

export type Breakpoint = keyof typeof breakpoints;

export interface BreakpointContextType {
    breakpoint: Breakpoint;
    orLower: (_: Breakpoint) => boolean;
}

export function useBreakpoint(): BreakpointContextType {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>("pc");

    useEffect(() => {
        const updateBreakpoint = () => {
            const width = window.innerWidth;
            if (width >= breakpoints.pc) setBreakpoint("pc");
            else if (width >= breakpoints.tb) setBreakpoint("tb");
            else if (width >= breakpoints.sp) setBreakpoint("sp");
            else setBreakpoint("min");
        };

        updateBreakpoint();
        window.addEventListener("resize", updateBreakpoint);
        return () => window.removeEventListener("resize", updateBreakpoint);
    }, []);

    const orLower = (bq: Breakpoint) => {
        console.log(isBreakpointOrLower(breakpoint, bq))
        return isBreakpointOrLower(breakpoint, bq)
    }

    return { breakpoint, orLower };
}

function isBreakpointOrLower(
    current: Breakpoint,
    target: Breakpoint
): boolean {
    const order: Breakpoint[] = ["min", "sp", "tb", "pc"];
    return order.indexOf(current) < order.indexOf(target);
}
