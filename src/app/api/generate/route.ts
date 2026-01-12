import { NextRequest, NextResponse } from "next/server";
import { Question, QuestionType, SkillType } from "@/store/use-exam-store";

const DIFY_HOST = process.env.NEXT_PUBLIC_DIFY_HOST;
const DIFY_API_KEY = process.env.NEXT_PUBLIC_DIFY_EXAMS_QUESTIONS_GENERATOR_TOKEN;

export async function POST(req: NextRequest) {
    if (!DIFY_HOST || !DIFY_API_KEY) {
        return NextResponse.json({ error: "Dify configuration is missing" }, { status: 500 });
    }

    try {
        const { range, skill, type } = await req.json();

        if (!range || !skill || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const prompt = `${range}, ['${skill}'], ['${type}']`;

        const response = await fetch(`${DIFY_HOST}/workflows/run`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${DIFY_API_KEY}`,
            },
            body: JSON.stringify({
                inputs: {
                    query: prompt,
                    request: prompt,
                },
                response_mode: "blocking",
                user: "user-" + Math.random().toString(36).substring(7),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Dify API error:", errorText);
            return NextResponse.json({ error: `Dify API error: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        console.log("Dify Raw Response:", JSON.stringify(data, null, 2));

        let resultString = "";
        if (data.result) resultString = data.result;
        else if (data.outputs?.result) resultString = data.outputs.result;
        else if (data.outputs?.text) resultString = data.outputs.text;
        else if (data.data?.outputs?.result) resultString = data.data.outputs.result;
        else if (data.data?.outputs?.text) resultString = data.data.outputs.text;
        else if (data.answer) resultString = data.answer;

        const questions = parseDifyCSV(resultString, skill, type);
        return NextResponse.json({ questions, raw: resultString });
    } catch (error: any) {
        console.error("Internal Server Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

function parseDifyCSV(raw: string, defaultSkill: SkillType, defaultType: QuestionType): Question[] {
    let cleanRaw = raw.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();

    let rows = cleanRaw.split("<_>").filter((row) => row.trim().length > 0);
    if (rows.length <= 1 && cleanRaw.includes("|->") && cleanRaw.includes("\n")) {
        rows = cleanRaw.split("\n").filter((row) => row.includes("|->"));
    }

    const questions: Question[] = [];

    rows.forEach((row) => {
        // Attempt 1: Standard pipe-separated parsing
        if (row.includes("|->")) {
            const parts = row.split("|->").map((p) => p.trim());
            if (parts.length >= 2) {
                let description = parts[0];
                let optionsStr = parts.length >= 5 ? parts[1] : "";
                let answer = parts.length >= 5 ? parts[2] : parts[1];
                let skill = (parts.length >= 5 ? parts[3] : defaultSkill) as SkillType;
                let type = (parts.length >= 5 ? parts[4] : defaultType) as QuestionType;

                // Cleanup options
                let options: string[] | null = null;
                if (type === "Multiple Choice") {
                    try {
                        const sanitized = (optionsStr || "").replace(/'/g, '"');
                        options = JSON.parse(sanitized);
                    } catch (e) {
                        options = (optionsStr || "")
                            .replace(/[\[\]']/g, "")
                            .split(",")
                            .map((o) => o.trim())
                            .filter((o) => o.length > 0);
                    }
                }

                questions.push({
                    id: crypto.randomUUID(),
                    description,
                    options,
                    answer,
                    skill,
                    type,
                });
                return;
            }
        }

        // Attempt 2: Regex-based Key-Value extraction (Fallback)
        const descMatch = row.match(/(?:Description|1\.|2\.|3\.|4\.|5\.):\s*([\s\S]*?)(?=Options:|Answer:|$)/i);
        const optMatch = row.match(/Options:\s*([\s\S]*?)(?=Answer:|$)/i);
        const ansMatch = row.match(/Answer:\s*([\s\S]*?)(?=Skill:|Type:|$)/i);

        if (descMatch && ansMatch) {
            let options: string[] | null = null;
            if (defaultType === "Multiple Choice" && optMatch) {
                const optStr = optMatch[1].trim();
                try {
                    options = JSON.parse(optStr.replace(/'/g, '"'));
                } catch (e) {
                    options = optStr
                        .replace(/[\[\]']/g, "")
                        .split(",")
                        .map((o) => o.trim())
                        .filter((o) => o.length > 0);
                }
            }

            questions.push({
                id: crypto.randomUUID(),
                description: descMatch[1].trim(),
                options: options || (defaultType === "Multiple Choice" ? [] : null),
                answer: ansMatch[1].trim(),
                skill: defaultSkill,
                type: defaultType,
            });
        }
    });

    return questions;
}
