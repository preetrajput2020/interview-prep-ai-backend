const Groq = require("groq-sdk");
const { conceptExplainPrompt, questionAnswerPrompt } = require("../utils/prompts");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// @desc    Generate interview questions and answers using Groq
// @route   POST /api/ai/generate-questions
// @access  Private
const generateInterviewQuestions = async (req, res) => {
  try {
    // Accept BOTH backend + frontend field names
    const {
      // backend expected keys
      role,
      experience,
      topicsToFocus,
      numberOfQuestions,

      // frontend possible keys
      targetRole,
      yearsOfExperience,
      topicsToFocusOn,
      topics,
      description,
      count,
    } = req.body;

    const finalRole = role || targetRole || "Interview Candidate";
    const finalExperience = experience || yearsOfExperience || "Fresher";
    const finalTopics = topicsToFocus || topicsToFocusOn || topics || "General";
    const finalCount = Number(numberOfQuestions || count || 10);

    if (!finalRole || !finalExperience || !finalTopics) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Use your existing prompt but add strict rules
    const basePrompt = questionAnswerPrompt(
      finalRole,
      finalExperience,
      finalTopics,
      finalCount
    );

    const prompt = `
${basePrompt}

Extra Notes (optional): ${description || "N/A"}

STRICT RULES:
- Return ONLY valid JSON (no markdown, no extra text)
- Do NOT include code blocks or code examples
- Keep answers in simple text

Return JSON in this exact format:
{
  "questions": [
    { "question": "....", "answer": "...." }
  ]
}
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You must return ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }, // forces JSON output
    });

    const rawText = response.choices?.[0]?.message?.content || "";

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({
        message: "AI returned invalid JSON",
        raw: rawText,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate questions",
      error: error.message,
    });
  }
};

// @desc    Generate explanation of an interview question using Groq
// @route   POST /api/ai/generate-explanation
// @access  Private
const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const basePrompt = conceptExplainPrompt(question);

    const prompt = `
${basePrompt}

STRICT RULES:
- Return ONLY valid JSON (no markdown, no extra text)
- Do NOT include code blocks

Return JSON in this exact format:
{
  "explanation": "...."
}
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You must return ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }, // forces JSON output
    });

    const rawText = response.choices?.[0]?.message?.content || "";

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({
        message: "AI returned invalid JSON",
        raw: rawText,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate explanation",
      error: error.message,
    });
  }
};

module.exports = { generateInterviewQuestions, generateConceptExplanation };
