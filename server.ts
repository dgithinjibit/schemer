import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { createRequire } from "module";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Load Curriculum Mapping from external file
const MAPPING_PATH = path.resolve("curriculum-mapping.json");
let CURRICULUM_FILES: Record<string, string> = {};

function loadMapping() {
  try {
    if (fs.existsSync(MAPPING_PATH)) {
      const data = fs.readFileSync(MAPPING_PATH, "utf-8");
      CURRICULUM_FILES = JSON.parse(data);
      console.log(`Loaded ${Object.keys(CURRICULUM_FILES).length} curriculum mappings.`);
    }
  } catch (e) {
    console.error("Failed to load curriculum mapping:", e);
  }
}

loadMapping();

// Watch for changes in mapping file (optional but helpful for ideation)
fs.watchFile(MAPPING_PATH, () => {
  console.log("Curriculum mapping file changed. Reloading...");
  loadMapping();
});

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
    
    // Correct usage of pdf-parse
    const data = await pdf(Buffer.from(response.data));
    
    res.json({ 
      text: data.text,
      pages: data.numpages
    });
  } catch (error: any) {
    console.error("Error fetching or parsing PDF:", error.message);
    res.status(500).json({ error: "Failed to process curriculum PDF. Google Drive might be blocking the request or the PDF is invalid." });
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
