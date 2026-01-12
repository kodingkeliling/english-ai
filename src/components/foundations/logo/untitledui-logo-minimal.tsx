"use client";

import type { SVGProps } from "react";
import { useId } from "react";
import { cx } from "@/utils/cx";

export const UntitledLogoMinimal = (props: SVGProps<SVGSVGElement>) => {
    const id = useId();

    return (
        <img src="/logo.png" alt="Logo" className="size-15" />
    );
};
