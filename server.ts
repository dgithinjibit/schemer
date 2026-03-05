import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { PDFParse } from "pdf-parse";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Curriculum Mapping (Example from user request)
const CURRICULUM_FILES: Record<string, string> = {
  "grade4_science": "1vrC5CJ02MpDm9v4u3-qwCze9yPa9HcEZ",
  // Add more mappings here as needed
};

// API Endpoint to get curriculum text
app.get("/api/curriculum/:key", async (req, res) => {
  const { key } = req.params;
  const fileId = CURRICULUM_FILES[key];

  if (!fileId) {
    return res.status(404).json({ error: "Curriculum file not found for this grade/subject." });
  }

  try {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
    console.log(`Fetching PDF from: ${url}`);
    
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    // Use the new PDFParse API
    const parser = new PDFParse({ data: response.data });
    const result = await parser.getText();
    
    res.json({ 
      text: result.text,
      pages: result.total
    });
  } catch (error: any) {
    console.error("Error fetching or parsing PDF:", error.message);
    res.status(500).json({ error: "Failed to process curriculum PDF. Google Drive might be blocking the request." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
