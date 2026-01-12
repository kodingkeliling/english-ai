"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, CheckCircle, Clock, Play, Trash01, Zap } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useExamStore, ExamAttempt } from "@/store/use-exam-store";
import { cx } from "@/utils/cx";

export const ExamHistory = () => {
    const router = useRouter();
    const { exams, selectExam, deleteExam } = useExamStore();

    if (exams.length === 0) return null;

    const handleAction = (exam: ExamAttempt) => {
        if (exam.status === "completed") {
            router.push(`/result/${exam.id}`);
        } else {
            router.push(`/playground/${exam.id}`);
        }
    };

    return (
        <div className="flex w-full max-w-2xl flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-primary">Your Test History</h2>
                <span className="text-sm text-tertiary">{exams.length} attempts</span>
            </div>

            <div className="flex flex-col gap-4">
                {exams.map((exam) => (
                    <div
                        key={exam.id}
                        className="group relative flex flex-col gap-4 rounded-2xl border border-secondary bg-primary p-5 shadow-xs transition-shadow hover:shadow-md w-full"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className={cx(
                                    "flex size-10 items-center justify-center rounded-lg shadow-xs",
                                    exam.status === "completed" ? "bg-success-100 text-success-600" : "bg-brand-100 text-brand-600"
                                )}>
                                    {exam.status === "completed" ? <CheckCircle className="size-5" /> : <Play className="size-5" />}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-md font-semibold text-primary">
                                        {exam.config.questionCount} Questions ({exam.config.skills.join(", ")})
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-tertiary">
                                        {/* <div className="flex items-center gap-1">
                                            <Calendar className="size-3.5" />
                                            {new Date(exam.createdAt).toLocaleDateString()}
                                        </div> */}
                                        <div className="flex items-center gap-1">
                                            <Clock className="size-3.5" />
                                            {new Date(exam.createdAt).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="items-center gap-2 hidden md:flex">
                                <Button
                                    size="sm"
                                    color="secondary"
                                    iconLeading={Trash01}
                                    onClick={() => deleteExam(exam.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                                <div className={cx(
                                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                    exam.status === "completed" ? "bg-success-50 text-success-700" : "bg-brand-50 text-brand-700"
                                )}>
                                    {exam.status === "completed" ? "Completed" : "In Progress"}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between mt-1">
                            <div className="flex gap-2 w-auto">
                                {exam.config.types.map(t => (
                                    <span key={t} className="text-xs text-tertiary bg-secondary px-2 py-0.5 rounded-md">
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <div className="flex w-full md:w-auto gap-2">
                                <Button
                                    size="sm"
                                    color="secondary"
                                    iconLeading={Trash01}
                                    onClick={() => deleteExam(exam.id)}
                                    className="md:hidden"
                                />
                                <Button
                                    size="sm"
                                    color={exam.status === "completed" ? "secondary" : "primary"}
                                    iconTrailing={ArrowRight}
                                    onClick={() => handleAction(exam)}
                                    className="w-full"
                                >
                                    {exam.status === "completed" ? "View Result" : "Continue Test"}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
