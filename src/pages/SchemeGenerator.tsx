import React, { useState, useRef } from 'react';
import { Download, Sparkles, Loader2, BookOpen, FileText, Languages } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown-light.css';
import { GoogleGenAI } from "@google/genai";
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

import { GRADE3_CREATIVE_ACTIVITIES } from '../curriculum/grade3-creative-activities';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Curriculum Registry for Ideation Mode
const CURRICULUM_REGISTRY: Record<string, any> = {
  "Grade 3_Creative Activities": GRADE3_CREATIVE_ACTIVITIES,
};

export const SchemeGenerator: React.FC = () => {
  const { profile } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [schemeOfWork, setSchemeOfWork] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState("Grade 3");
  const [selectedSubject, setSelectedSubject] = useState("Creative Activities");
  const [term, setTerm] = useState("Term 1");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const generateSchemeOfWork = async () => {
    setIsGenerating(true);
    try {
      let curriculumContext = "";
      
      // 1. Check local structured curriculum registry (Primary Ideation Source)
      const registryKey = `${selectedGrade}_${selectedSubject}`;
      const structuredCurriculum = CURRICULUM_REGISTRY[registryKey];
      
      if (structuredCurriculum && structuredCurriculum.terms[term]) {
        const termData = structuredCurriculum.terms[term];
        curriculumContext = `\n\nOFFICIAL KICD TERM-SPECIFIC DATA:\n${JSON.stringify(termData, null, 2)}`;
      } else {
        // 2. Fallback to API for other subjects (Automated PDF Extraction)
        const curriculumKey = `${selectedGrade.toLowerCase().replace(" ", "")}_${selectedSubject.toLowerCase().split(" ")[0]}`;
        try {
          const curriculumRes = await fetch(`/api/curriculum/${curriculumKey}`);
          if (curriculumRes.ok) {
            const data = await curriculumRes.json();
            // Extract a relevant chunk or the whole text if small enough
            curriculumContext = `\n\nEXTRACTED KICD CURRICULUM TEXT:\n${data.text.substring(0, 15000)}`;
          } else {
            console.warn(`No curriculum file mapped for ${curriculumKey}`);
          }
        } catch (e) {
          console.warn("Curriculum fetch failed", e);
        }
      }

      const isKiswahili = selectedSubject.toLowerCase() === "kiswahili";
      
      const model = "gemini-3-flash-preview";
      const prompt = `Generate a comprehensive 14-WEEK SCHEME OF WORK for ${selectedGrade} ${selectedSubject} for ${term}.
      
      HIERARCHICAL KNOWLEDGE SOURCES:
      1. PRIMARY SOURCE (Structured Curriculum Data): ${curriculumContext}
      2. SECONDARY SOURCE: Your internal training on Kenyan CBC standards.

      LANGUAGE & PERSONA:
      - Persona: "Mwalimu AI" - A veteran Kenyan teacher and KICD consultant.
      - Language: ${isKiswahili ? "KISWAHILI (Use Swahili headers and instructional language)" : "ENGLISH (Use Kenyan instructional terms like 'Learners', 'Manila papers', 'Sisal', 'M-Pesa')"}
      
      OUTPUT REQUIREMENTS:
      0. STRICTLY NO PREAMBLE: Do not include any greetings, introductions, or conversational text. Start immediately with the Administrative Header.
      
      1. Administrative Header:
         - Title: SCHEME OF WORK (Centered, Bold, Underlined)
         - School Name: [Your School Name]
         - Teacher’s Name: [Your Name]
         - Learning Area (Subject): ${selectedSubject}
         - Grade/Class: ${selectedGrade}
         - Term & Year: ${term}, 2026

      2. Instructional Table (Core Components):
         - Format: STRICT MARKDOWN TABLE.
         - Columns: 
           - Week
           - Lesson
           - Strand
           - Sub-Strand
           - Learning Outcomes
           - Learning Experiences (Must be detailed, experiential CBC activities)
           - Key Inquiry Questions (KIQ)
           - Learning Resources (Emphasis on Charts and local realia)
           - Assessment
           - Reflections
         - CRITICAL REQUIREMENT: Generate a SEPARATE ROW for EVERY SINGLE LESSON. Do not group lessons (e.g., do not use '1-3'). If there are 3 lessons per week, generate 3 distinct rows for that week (Lesson 1, Lesson 2, Lesson 3).

      3. Footer:
         - Copyright: © 2025 3D SyncSenta | Grounded in the Kenyan CBC
      
      4. Content: Must be strictly aligned with the provided Term-Specific Data. Do not invent strands that are not in the data for this term. Map the 14 weeks across the sub-strands provided.
      
      PEDAGOGICAL NOTE: Focus on what learners can DO (Competency-Based). Ensure the 'Learning Experiences' are concrete activities (group work, role play, digital exploration).`;
      
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "You are 'Mwalimu AI', a Senior Curriculum Developer at KICD. You specialize in creating highly detailed 14-week Schemes of Work that are CBC-compliant. You provide structured tables with Week, Lesson, Strand, Sub-Strand, Learning Outcomes, Learning Experiences, Key Inquiry Questions (KIQ), Learning Resources, Assessment, and Reflections columns. CRITICAL: You MUST generate a separate row for every single lesson (e.g., Week 1 Lesson 1, Week 1 Lesson 2). DO NOT group lessons. Learning resources must be relevant to the Kenyan context, with a strong emphasis on 'Charts'. DO NOT include any introductory text, greetings, or conversational preamble. Start directly with the Administrative Header."
        }
      });
      
      const content = response.text;
      setSchemeOfWork(content);

      // Firestore storage disabled for now as per user request
      /*
      try {
        await addDoc(collection(db, 'schemesOfWork'), {
          teacherId: user?.uid,
          learningArea: selectedSubject,
          grade: selectedGrade,
          term: term,
          content: content,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'schemesOfWork');
      }
      */

    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: landscape; margin: 0.5cm; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            color: #000;
            background: #fff;
          }
          .no-print { display: none !important; }
          
          /* Official Table Styling */
          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 8px; 
            margin-top: 10px;
            table-layout: fixed;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 4px 6px; 
            text-align: left; 
            vertical-align: top;
            word-wrap: break-word;
            line-height: 1.2;
          }
          th { 
            background-color: #e5e7eb !important; 
            font-weight: bold;
            text-transform: uppercase;
            -webkit-print-color-adjust: exact; 
          }
          
          /* Administrative Header Styling */
          .admin-header {
            border: 2px solid #000;
            padding: 15px;
            margin-bottom: 10px;
          }
          .admin-header h1 {
            text-align: center;
            text-decoration: underline;
            font-size: 18px;
            margin-bottom: 10px;
            font-weight: 900;
          }
          
          .official-header {
            border-bottom: 4px double #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          
          /* Prevent row breaking across pages */
          tr { page-break-inside: avoid; }
          
          /* Markdown specific fixes for print */
          .markdown-body h1, .markdown-body h2, .markdown-body h3 { 
            margin-top: 10px; 
            margin-bottom: 5px;
            font-size: 14px;
            border-bottom: 1px solid #eee;
          }
          .markdown-body p { margin: 5px 0; }
          .markdown-body ul { padding-left: 15px; }
          .markdown-body table { border: 1px solid #000 !important; }
          .markdown-body th, .markdown-body td { border: 1px solid #000 !important; }
          
          #print-area::before {
            content: "OFFICIAL CBC DOCUMENT";
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: rgba(0,0,0,0.03);
            z-index: -1;
            white-space: nowrap;
            pointer-events: none;
          }
        }
      `}} />

      <nav className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black">S</div>
            <span className="font-bold text-slate-900 tracking-tight">SyncSenta <span className="text-emerald-600">Mwalimu AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-900">Mwalimu Developer</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Ideation Mode</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12 no-print">
        <div className="max-w-3xl mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">14-Week Scheme Generator</h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            The "Mwalimu AI" engine creates professional CBC schemes of work. 
            Paste your notes, select your grade, and generate a term-long document in seconds.
          </p>
        </div>

        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Select Grade</label>
              <select 
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none"
              >
                {["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Learning Area</label>
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none"
              >
                {["Creative Activities", "Religious Education (CRE)", "Science and Technology", "Mathematics", "English", "Kiswahili", "Social Studies", "Creative Arts", "Agriculture", "Nutrition"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">School Term</label>
              <select 
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none"
              >
                {["Term 1", "Term 2", "Term 3"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={generateSchemeOfWork}
            disabled={isGenerating}
            className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-xl shadow-emerald-200 flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" />
                Mwalimu AI is Crafting Your Scheme...
              </>
            ) : (
              <>
                <Sparkles size={24} />
                Generate 14-Week CBC Scheme
              </>
            )}
          </button>
        </div>

        {schemeOfWork && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900">Generated Scheme of Work</h2>
                {selectedSubject.toLowerCase() === "kiswahili" && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Languages size={12} />
                    Kiswahili Mode
                  </span>
                )}
              </div>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                <Download size={20} />
                Save as PDF
              </button>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm overflow-x-auto">
              <div className="markdown-body !bg-transparent">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {schemeOfWork}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Hidden Print Area */}
      <div id="print-area" className="hidden print:block p-8">
        <div className="text-center official-header">
          <div className="text-lg font-black tracking-widest uppercase">Republic of Kenya</div>
          <div className="text-sm font-bold uppercase mt-1">Ministry of Education</div>
          <div className="w-24 h-1 bg-black mx-auto mt-2"></div>
        </div>
        
        <div className="markdown-body !bg-transparent">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {schemeOfWork || ""}
          </ReactMarkdown>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-10 text-[10px] font-bold">
          <div className="border-t-2 border-black pt-2">
            TEACHER'S SIGNATURE: ____________________
            <div className="mt-1 font-normal">Date: ____/____/2026</div>
          </div>
          <div className="border-2 border-black p-4 flex flex-col items-center justify-center min-h-[80px]">
            <span className="text-[8px] uppercase opacity-30">Official School Stamp</span>
          </div>
          <div className="border-t-2 border-black pt-2">
            HEAD OF SCHOOL SIGNATURE: ____________________
            <div className="mt-1 font-normal">Date: ____/____/2026</div>
          </div>
        </div>
        <div className="mt-8 text-center text-[8px] text-slate-400 italic flex items-center justify-center gap-2">
          <div className="w-12 h-12 border-2 border-emerald-600 rounded-full flex items-center justify-center text-emerald-600 font-black text-[10px] rotate-12">
            AI VERIFIED
          </div>
          Generated by SyncSenta Mwalimu AI | Grounded in KICD CBC Standards
        </div>
      </div>
    </div>
  );
};
