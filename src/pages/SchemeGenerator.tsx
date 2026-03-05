import React, { useState, useRef } from 'react';
import { Download, Sparkles, Loader2, BookOpen, FileText, Languages } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleGenAI } from "@google/genai";
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const SchemeGenerator: React.FC = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [schemeOfWork, setSchemeOfWork] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState("Grade 4");
  const [selectedSubject, setSelectedSubject] = useState("Science and Technology");
  const [term, setTerm] = useState("Term 1");
  const [referenceNotes, setReferenceNotes] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const generateSchemeOfWork = async () => {
    setIsGenerating(true);
    try {
      let curriculumContext = "";
      
      const curriculumKey = `${selectedGrade.toLowerCase().replace(" ", "")}_${selectedSubject.toLowerCase().split(" ")[0]}`;
      try {
        const curriculumRes = await fetch(`/api/curriculum/${curriculumKey}`);
        if (curriculumRes.ok) {
          const data = await curriculumRes.json();
          curriculumContext = `\n\nOFFICIAL KICD CURRICULUM DATA (Secondary Source):\n${data.text.substring(0, 10000)}`;
        }
      } catch (e) {
        console.warn("Curriculum fetch failed", e);
      }

      const isKiswahili = selectedSubject.toLowerCase() === "kiswahili";
      
      const model = "gemini-3-flash-preview";
      const prompt = `Generate a comprehensive 14-WEEK SCHEME OF WORK for ${selectedGrade} ${selectedSubject} for ${term}.
      
      HIERARCHICAL KNOWLEDGE SOURCES:
      1. PRIMARY SOURCE (Reference Notes): ${referenceNotes || "None provided. Move to secondary source."}
      2. SECONDARY SOURCE (Curriculum Files): ${curriculumContext}
      3. TERTIARY SOURCE: Your internal training on Kenyan CBC standards.

      LANGUAGE & PERSONA:
      - Persona: "Mwalimu AI" - A veteran Kenyan teacher and KICD consultant.
      - Language: ${isKiswahili ? "KISWAHILI (Use Swahili headers and instructional language)" : "ENGLISH (Use Kenyan instructional terms like 'Learners', 'Manila papers', 'Sisal', 'M-Pesa')"}
      
      OUTPUT REQUIREMENTS:
      1. Structure: 14 Weeks total.
      2. Format: STRICT MARKDOWN TABLE.
      3. Columns: 
         - Week
         - Lesson
         - Strand
         - Sub-Strand (Lessons)
         - Specific Learning Outcomes
         - Suggested Learning Experiences
         - Key Inquiry Questions (Make these Socratic and critical-thinking focused)
         - Core Competencies
         - Values
         - PCIs (Pertinent and Contemporary Issues)
         - Assessment
      
      4. Content: Must be strictly aligned with the Kenyan CBC curriculum. Provide specific, actionable activities for each week.`;
      
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "You are 'Mwalimu AI', a Senior Curriculum Developer at KICD. You specialize in creating highly detailed 14-week Schemes of Work that are CBC-compliant and pedagogically sound for the Kenyan context."
        }
      });
      
      const content = response.text;
      setSchemeOfWork(content);

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
          @page { size: landscape; margin: 1cm; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid #000; padding: 4px; text-align: left; }
          th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
        }
      `}} />

      <nav className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black">S</div>
            <span className="font-bold text-slate-900 tracking-tight">SyncSenta <span className="text-emerald-600">Mwalimu AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500">CBC Standard v2.1</div>
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
                {["Science and Technology", "Mathematics", "English", "Kiswahili", "Social Studies", "Creative Arts", "Agriculture", "Nutrition"].map(s => <option key={s}>{s}</option>)}
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

          <div className="mb-8 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileText size={14} />
              Reference Notes (Primary Source / RAG)
            </label>
            <textarea 
              value={referenceNotes}
              onChange={(e) => setReferenceNotes(e.target.value)}
              placeholder="Paste specific lesson notes, textbook excerpts, or teacher guides here. The AI will treat this as the absolute truth."
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all min-h-[120px]"
            />
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
            
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm overflow-x-auto markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {schemeOfWork}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </main>

      {/* Hidden Print Area */}
      <div id="print-area" className="hidden print:block p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold uppercase underline">SCHEME OF WORK</h1>
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm font-bold">
            <div>GRADE: {selectedGrade.toUpperCase()}</div>
            <div>SUBJECT: {selectedSubject.toUpperCase()}</div>
            <div>TERM: {term.toUpperCase()}</div>
          </div>
        </div>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {schemeOfWork || ""}
          </ReactMarkdown>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-20 text-sm font-bold">
          <div className="border-t border-black pt-2">TEACHER SIGNATURE: ____________________</div>
          <div className="border-t border-black pt-2">HEAD OF SCHOOL SIGNATURE: ____________________</div>
        </div>
      </div>
    </div>
  );
};
