"use client";

import { Radio, RadioGroup } from "react-aria-components";
import { cx } from "@/utils/cx";

import { Markdown } from "@/components/shared-assets/markdown";

interface QuestionOptionsProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
}

export const QuestionOptions = ({ options, value, onChange }: QuestionOptionsProps) => {
    return (
        <RadioGroup
            value={value}
            onChange={onChange}
            className="flex flex-col gap-3"
        >
            {options.map((option, idx) => (
                <Radio
                    key={idx}
                    value={option}
                    className={({ isSelected, isFocusVisible, isDisabled }) =>
                        cx(
                            "relative flex cursor-pointer rounded-xl bg-primary p-4 transition-all outline-hidden ring-inset",
                            isSelected ? "ring-2 ring-brand-600 bg-brand-soft/10" : "ring-1 ring-secondary hover:bg-secondary",
                            isDisabled && "cursor-not-allowed bg-disabled_subtle ring-disabled",
                            isFocusVisible && "ring-2 ring-brand-600 ring-offset-2"
                        )
                    }
                >
                    {({ isSelected }) => (
                        <div className="flex items-center gap-3">
                            <div
                                className={cx(
                                    "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                                    isSelected ? "border-brand-600 bg-brand-600" : "border-secondary bg-primary"
                                )}
                            >
                                {isSelected && (
                                    <div className="size-2 rounded-full bg-white" />
                                )}
                            </div>
                            <div className={cx(
                                "text-md font-medium transition-colors flex-1",
                                isSelected ? "text-brand-700" : "text-primary"
                            )}>
                                <Markdown content={option} isTruncated lineClamp={2} />
                            </div>
                        </div>
                    )}
                </Radio>
            ))}
        </RadioGroup>
    );
};
