import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

app.post("/api/generate", async (req, res) => {
  try {
    const key = process.env.GROQ_API_KEY;

    if (!key) {
      return res.status(503).json({
        error: "GROQ_API_KEY server par set nahi hai."
      });
    }

    const idea = String(req.body.idea || "").slice(0, 2000);

    if (!idea.trim()) {
      return res.status(400).json({ error: "Story idea likho." });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an expert anime writer.
Create an original Hindi anime story from the user's idea.
Return ONLY valid JSON with two keys:
"story": complete Hindi story in Devanagari.
"parts": array of 3 objects, each containing "part" and "prompt".
Each prompt must describe a connected 10-second vertical 9:16 anime video scene.
Keep characters, faces, clothes and locations consistent.
Give the story a proper ending.`
            },
            {
              role: "user",
              content: idea
            }
          ],
          temperature: 0.8,
          max_tokens: 3500,
          response_format: { type: "json_object" }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: data.error?.message || "AI service error."
      });
    }

    const result = JSON.parse(data.choices[0].message.content);
    res.json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("ANIME STORY AI is running");
});
