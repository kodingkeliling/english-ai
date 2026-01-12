"use client";

import { BookOpen01, Zap } from "@untitledui/icons";
import { ConfigForm } from "@/components/exam/config-form";
import { ExamHistory } from "@/components/exam/exam-history";
import { useExamStore } from "@/store/use-exam-store";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ThemeToggle } from "@/components/foundations/theme-toggle";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal";
import { Badge } from "@/components/base/badges/badges";

export const HomeScreen = () => {
    const exams = useExamStore((state) => state.exams);

    return (
        <div className="flex min-h-dvh flex-col bg-primary relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute -top-[10%] -left-[10%] size-[40%] rounded-full bg-brand-soft/20 blur-[120px]" />
            <div className="absolute -bottom-[10%] -right-[10%] size-[40%] rounded-full bg-brand-soft/20 blur-[120px]" />

            <header className="mx-auto flex w-full max-w-container items-center justify-between px-4 py-6 md:px-8">
                <div className="flex items-center gap-2">
                    <UntitledLogoMinimal className="size-8" />
                    <span className="text-xl font-bold text-primary">Inggris AI</span>
                    <Badge color="success">Free</Badge>
                </div>
                <ThemeToggle />
            </header>

            <main className="relative flex flex-1 flex-col items-center">
                {/* Hero & Config Form */}
                <section className="mx-auto flex w-full max-w-container flex-col items-center justify-center gap-12 py-16 lg:flex-row lg:items-start lg:justify-between lg:px-8 lg:py-24">
                    <div className="flex max-w-xl flex-col gap-6 text-center lg:text-left">
                        <div className="flex justify-center lg:justify-start">
                            <FeaturedIcon icon={Zap} color="brand" theme="light" size="lg" />
                        </div>

                        <div className="flex flex-col gap-4">
                            <h1 className="text-display-md font-semibold text-primary lg:text-display-xl">
                                Master English with AI-Powered Testing
                            </h1>
                            <p className="text-lg text-tertiary lg:text-xl">
                                Generate personalized English exams in seconds. Practice Reading, Writing, Speaking, and Listening with custom-made questions tailored to your needs.
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
                            <div className="flex items-center gap-2 rounded-full border border-secondary bg-primary px-3 py-1 text-sm font-medium text-secondary">
                                <BookOpen01 className="size-4" />
                                <span>Learn faster</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-full border border-secondary bg-primary px-3 py-1 text-sm font-medium text-secondary">
                                <Zap className="size-4" />
                                <span>AI Generated</span>
                            </div>
                        </div>
                    </div>

                    <div className="z-10 w-full lg:max-w-md flex w-full justify-center">
                        <ConfigForm />
                    </div>
                </section>

                {/* History Section */}
                {exams.length > 0 && (
                    <section className="mx-auto w-full max-w-container px-4 py-16 flex flex-col items-center md:px-8 bg-secondary/30 rounded-3xl mb-20">
                        <ExamHistory />
                    </section>
                )}
            </main>

            <footer className="mx-auto w-full max-w-container px-4 py-8 md:px-8">
                <p className="text-center text-sm text-tertiary">
                    &copy; 2026 Inggris AI. Powered by Koding Keliling.
                </p>
            </footer>
        </div>
    );
};
