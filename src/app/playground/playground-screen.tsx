"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, ChevronLeft, Flag01, LayoutGrid02, Zap } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { QuestionOptions } from "@/components/exam/question-options";
import { AudioPlayer } from "@/components/exam/audio-player";
import { ThemeToggle } from "@/components/foundations/theme-toggle";
import { useExamStore, useActiveExam, Question } from "@/store/use-exam-store";
import { cx } from "@/utils/cx";
import { Markdown } from "@/components/shared-assets/markdown";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Heading as AriaHeading } from "react-aria-components";

export const PlaygroundScreen = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const activeExam = useActiveExam();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const {
        selectExam,
        setQuestions,
        setStatus,
        setAnswer,
        nextQuestion,
        prevQuestion,
        goToQuestion,
        finishExam,
        deleteExam,
        exams,
        hasHydrated,
    } = useExamStore();

    const [generatingProgress, setGeneratingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const isGenerating = useRef(false);

    const generateAllQuestions = useCallback(async () => {
        if (isGenerating.current) return;
        isGenerating.current = true;

        setStatus("generating");
        setError(null);
        setGeneratingProgress(0);

        const chunkSize = 1;
        const total = activeExam!.config!.questionCount;
        const chunks = Math.ceil(total / chunkSize);

        let allQuestions: Question[] = [];

        try {
            for (let i = 0; i < chunks; i++) {
                const range = `question nomor ${i + 1}`;

                const config = activeExam!.config;
                const skill = config.skills[Math.floor(Math.random() * config.skills.length)];
                const type = config.types[Math.floor(Math.random() * config.types.length)];

                const prompt = `${range}, ['${skill}'], ['${type}']`;

                const response = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ range, skill, type }),
                });

                const chunkData = await response.json();
                console.log(`Chunk ${i + 1} response:`, chunkData);

                if (!response.ok) {
                    throw new Error(chunkData.error || "Failed to generate chunk");
                }

                const { questions: chunkQuestions } = chunkData;
                allQuestions = [...allQuestions, ...chunkQuestions];

                setGeneratingProgress(Math.round(((i + 1) / chunks) * 100));
            }

            if (allQuestions.length === 0) {
                throw new Error("AI failed to generate any questions. Please try again.");
            }

            setQuestions(allQuestions.slice(0, total));
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to generate questions. Please try again.");
            // Do NOT set status back to idle automatically to prevent loops
            // setStatus("idle"); 
        } finally {
            isGenerating.current = false;
        }
    }, [activeExam?.config, setStatus, setQuestions]);
    // Sync active exam with URL
    useEffect(() => {
        if (hasHydrated && id && id !== activeExam?.id) {
            selectExam(id);
        }
    }, [id, activeExam?.id, selectExam, hasHydrated]);

    // If no active exam and not found in list, redirect back home
    useEffect(() => {
        if (hasHydrated && id && !exams.find(e => e.id === id)) {
            router.push("/");
        }
    }, [id, exams, router, hasHydrated]);

    // Handle initial generation if status is idle
    useEffect(() => {
        if (activeExam?.status === "idle" && (activeExam?.config?.questionCount || 0) > 0) {
            generateAllQuestions();
        }
    }, [activeExam?.status, generateAllQuestions]);

    if (!activeExam) return null;

    const { config, questions, status, currentQuestionIndex, userAnswers } = activeExam;

    if (status === "generating") {
        return (
            <div className="flex h-dvh flex-col items-center justify-center gap-8 bg-primary px-4">
                <div className="flex flex-col items-center gap-4 text-center">
                    <FeaturedIcon icon={Zap} color="brand" theme="light" size="lg" className="animate-pulse" />
                    <h2 className="text-display-sm font-semibold text-primary">AI is crafting your exam...</h2>
                    <p className="text-md text-tertiary">Generating {config.questionCount} questions based on your preferences.</p>
                </div>
                <div className="w-full max-w-md">
                    <ProgressBar value={generatingProgress} labelPosition="bottom" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-primary px-4">
                <div className="text-center">
                    <h2 className="text-display-sm font-semibold text-error-600">Oops! Something went wrong</h2>
                    <p className="mt-2 text-md text-tertiary">{error}</p>
                </div>
                <Button onClick={generateAllQuestions}>Retry Generation</Button>
                <Button color="secondary" onClick={() => { deleteExam(activeExam.id); router.push("/"); }}>Cancel & Back Home</Button>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-primary px-4">
                <div className="text-center">
                    <FeaturedIcon icon={Zap} color="brand" theme="light" size="lg" />
                    <h2 className="text-display-sm font-semibold text-primary">No questions found</h2>
                    <p className="mt-2 text-md text-tertiary">We couldn't find any questions for this exam.</p>
                </div>
                <Button onClick={generateAllQuestions}>Generate Questions</Button>
                <Button color="secondary" onClick={() => router.push("/")}>Back to Home</Button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
        return (
            <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-primary px-4 text-center">
                <p className="text-md text-tertiary">Loading question {currentQuestionIndex + 1}...</p>
                <Button color="secondary" onClick={() => goToQuestion(0)}>Reset to Question 1</Button>
            </div>
        );
    }

    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
        <div className="flex min-h-dvh flex-col bg-primary">
            <header className="sticky top-0 z-30 border-b border-secondary bg-primary px-4 py-3 md:px-8">
                <div className="mx-auto flex w-full max-w-container items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-4">
                        <Button color="tertiary" size="sm" iconLeading={ChevronLeft} onClick={() => router.push("/")} className="max-md:px-2">
                            <span className="hidden md:inline">Exit</span>
                        </Button>
                        <hr className="h-4 w-px bg-border-secondary md:h-6" />
                        <span className="text-xs font-semibold text-primary md:text-sm">
                            {currentQuestionIndex + 1}/{questions.length}
                        </span>
                    </div>

                    <div className="hidden items-center gap-2 md:flex">
                        <ProgressBar value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-40" />
                        <span className="text-xs font-medium text-tertiary">{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button className="md:hidden" color="secondary" size="sm" iconLeading={LayoutGrid02} onClick={() => setIsMobileMenuOpen(true)} />
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 flex items-end justify-center bg-overlay/40 backdrop-blur-sm md:hidden">
                    <div className="w-full bg-primary rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-secondary" onClick={() => setIsMobileMenuOpen(false)} />
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-primary">Jump to Question</h3>
                            <Button size="sm" color="tertiary" onClick={() => setIsMobileMenuOpen(false)}>Close</Button>
                        </div>
                        <div className="grid grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto pb-8">
                            {questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        goToQuestion(idx);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={cx(
                                        "flex aspect-square items-center justify-center rounded-xl text-sm font-semibold transition-all",
                                        currentQuestionIndex === idx
                                            ? "bg-brand-solid text-white shadow-md scale-105"
                                            : userAnswers[questions[idx].id]
                                                ? "bg-brand-soft text-brand-700 font-bold"
                                                : "bg-secondary text-secondary hover:bg-tertiary"
                                    )}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:gap-8 md:px-8 md:py-8">
                <aside className="hidden h-fit w-64 shrink-0 flex-col gap-4 rounded-xl border border-secondary p-4 md:flex">
                    <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">Questions</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goToQuestion(idx)}
                                className={cx(
                                    "flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer",
                                    currentQuestionIndex === idx
                                        ? "bg-brand-solid text-white shadow-sm"
                                        : userAnswers[questions[idx].id]
                                            ? "bg-brand-soft text-brand-700"
                                            : "bg-secondary text-secondary hover:bg-tertiary"
                                )}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="flex flex-1 flex-col gap-8">
                    <div className="flex flex-col gap-4 md:gap-6 rounded-2xl border border-secondary bg-primary p-5 shadow-xs md:p-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] md:text-xs font-semibold text-brand-700">
                                    {currentQuestion.skill}
                                </span>
                                <span className="rounded-full bg-secondary-subtle px-2.5 py-0.5 text-[10px] md:text-xs font-semibold text-tertiary">
                                    {currentQuestion.type}
                                </span>
                            </div>
                            {/* <Button color="tertiary" size="sm" iconLeading={Flag01} className="max-md:px-2" /> */}
                        </div>

                        <div className="flex flex-col gap-4 md:gap-6">
                            {currentQuestion.skill === "Listening" ? (
                                <AudioPlayer text={currentQuestion.description} />
                            ) : (
                                <Markdown content={currentQuestion.description} className="text-md md:text-lg font-medium text-primary" />
                            )}
                        </div>

                        <div className="mt-2 md:mt-4">
                            {currentQuestion.type === "Multiple Choice" ? (
                                <QuestionOptions
                                    options={currentQuestion.options || []}
                                    value={userAnswers[currentQuestion.id] || ""}
                                    onChange={(val: string) => setAnswer(currentQuestion.id, val)}
                                />
                            ) : (
                                <textarea
                                    className="w-full min-h-[150px] md:min-h-[200px] rounded-xl border border-secondary bg-primary p-4 text-sm md:text-md text-primary outline-hidden ring-brand focus:ring-2"
                                    placeholder="Type your answer here..."
                                    value={userAnswers[currentQuestion.id] || ""}
                                    onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto gap-4">
                        <Button
                            color="secondary"
                            size="lg"
                            iconLeading={ArrowLeft}
                            isDisabled={currentQuestionIndex === 0}
                            onClick={prevQuestion}
                            className="flex-1 md:flex-initial"
                        >
                            <span className="hidden sm:inline">Previous</span>
                        </Button>

                        {isLastQuestion ? (
                            <Button
                                size="lg"
                                color="primary"
                                iconTrailing={CheckCircle}
                                onClick={() => setIsConfirmModalOpen(true)}
                                className="flex-1 md:flex-initial"
                            >
                                Finish Exam
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                color="primary"
                                iconTrailing={ArrowRight}
                                onClick={nextQuestion}
                                className="flex-1 md:flex-initial"
                            >
                                <span className="hidden sm:inline">Next Question</span>
                                <span className="sm:hidden">Next</span>
                            </Button>
                        )}
                    </div>
                </section>
            </main>
            <DialogTrigger isOpen={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <ModalOverlay isDismissable>
                    <Modal>
                        <Dialog>
                            <div className="relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl sm:max-w-md">
                                <div className="flex flex-col gap-4 px-4 pt-5 sm:flex-row sm:px-6 sm:pt-6">
                                    <div className="flex-shrink-0">
                                        <FeaturedIcon icon={CheckCircle} color="brand" theme="light" size="lg" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <AriaHeading slot="title" className="text-lg font-semibold text-primary">
                                            Finish Exam?
                                        </AriaHeading>
                                        <p className="text-sm text-tertiary">
                                            Are you sure you want to finish the exam? You won't be able to change your answers after this.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col-reverse gap-3 p-4 pt-6 sm:flex-row sm:px-6 sm:pb-6">
                                    <Button color="secondary" size="lg" onClick={() => setIsConfirmModalOpen(false)} className="flex-1">
                                        Cancel
                                    </Button>
                                    <Button
                                        color="primary"
                                        size="lg"
                                        onClick={() => {
                                            setIsConfirmModalOpen(false);
                                            finishExam();
                                            router.push(`/result/${activeExam.id}`);
                                        }}
                                        className="flex-1"
                                    >
                                        Yes, Finish
                                    </Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </DialogTrigger>
        </div>
    );
};
