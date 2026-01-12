"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { SkillType, QuestionType, useExamStore } from "@/store/use-exam-store";
import { Badge } from "@/components/base/badges/badges";

export const ConfigForm = () => {
    const router = useRouter();
    const createNewExam = useExamStore((state) => state.createNewExam);

    const [questionCount, setQuestionCount] = useState(10);
    const [selectedSkills, setSelectedSkills] = useState<SkillType[]>(["Reading"]);
    const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(["Multiple Choice"]);

    const handleGenerate = () => {
        if (questionCount === 0) {
            return;
        }

        if (selectedSkills.length === 0 || selectedTypes.length === 0) {
            alert("Please select at least one skill and one question type.");
            return;
        }

        const examId = createNewExam({
            questionCount,
            skills: selectedSkills,
            types: selectedTypes,
        });

        // We'll redirect to playground where generation happens
        router.push(`/playground/${examId}`);
    };

    const toggleSkill = (skill: SkillType) => {
        setSelectedSkills((prev) =>
            prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
        );
    };

    const toggleType = (type: QuestionType) => {
        setSelectedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    return (
        <div className="flex w-full max-w-md flex-col gap-8 rounded-2xl border border-secondary bg-primary p-6 shadow-sm">
            <div className="flex flex-col gap-2">
                <h2 className="text-display-xs font-semibold text-primary">Setup Your AI English Test</h2>
                <p className="text-md text-tertiary">Configure the exam parameters to generate questions.</p>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                    <Label>Number of Questions</Label>
                    <Input
                        type="number"
                        value={questionCount.toString()}
                        onChange={(val: string) => {
                            const num = parseInt(val) || 0;
                            setQuestionCount(Math.max(0, Math.min(100, num)));
                        }}
                        placeholder="E.g. 10"
                        isRequired
                        isInvalid={questionCount === 0}
                        hint={questionCount === 0 ? "Must be more than 0." : undefined}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <Label>Skills to Test</Label>
                    <div className="grid grid-cols-2 gap-4">
                        {(["Reading", "Writing", "Speaking", "Listening"] as SkillType[]).map((skill) => (
                            <Checkbox
                                key={skill}
                                label={
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span>{skill}</span>
                                        {skill === "Speaking" && (
                                            <Badge size="sm" color="warning" className="text-[10px] py-0 px-1.5 whitespace-nowrap">
                                                Coming Soon
                                            </Badge>
                                        )}
                                    </div>
                                }
                                isDisabled={skill === "Speaking"}
                                isSelected={selectedSkills.includes(skill)}
                                onChange={() => toggleSkill(skill)}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Label>Question Types</Label>
                    <div className="grid grid-cols-2 gap-4">
                        {(["Multiple Choice", "Essay"] as QuestionType[]).map((type) => (
                            <Checkbox
                                key={type}
                                label={
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span>{type}</span>
                                        {type === "Essay" && (
                                            <Badge size="sm" color="warning" className="text-[10px] py-0 px-1.5 whitespace-nowrap">
                                                Coming Soon
                                            </Badge>
                                        )}
                                    </div>
                                }
                                isDisabled={type === "Essay"}
                                isSelected={selectedTypes.includes(type)}
                                onChange={() => toggleType(type)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <Button size="xl" onClick={handleGenerate} className="w-full">
                Generate Test questions
            </Button>
        </div>
    );
};
