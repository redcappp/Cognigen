import jsPDF from 'jspdf';

// --- Shared Helper to Setup Document ---
const createDoc = (title) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxLineWidth = pageWidth - (margin * 2);
  let yPos = 20;

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Date
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);
  yPos += 10;
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  return { doc, pageWidth, pageHeight, margin, maxLineWidth, yPos };
};

// --- Function 1: Question Paper (No Answers) ---
export const generateQuestionPaper = (questions, title = "Question Paper") => {
  let { doc, pageHeight, margin, maxLineWidth, yPos } = createDoc(title);

  questions.forEach((q, index) => {
    // Check for page break
    if (yPos + 40 >= pageHeight - margin) {
      doc.addPage();
      yPos = 20;
    }

    // Question Number & Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const questionText = `Q${index + 1}. ${q.question}`;
    const splitQuestion = doc.splitTextToSize(questionText, maxLineWidth);
    doc.text(splitQuestion, margin, yPos);
    yPos += (splitQuestion.length * 7) + 2;

    // Options (for MCQs)
    if (q.options) {
      doc.setFont("helvetica", "normal");
      Object.entries(q.options).forEach(([key, value]) => {
        // Check page break for options
        if (yPos + 10 >= pageHeight - margin) {
          doc.addPage();
          yPos = 20;
        }
        const optionText = `${key}) ${value}`;
        const splitOption = doc.splitTextToSize(optionText, maxLineWidth - 10);
        doc.text(splitOption, margin + 10, yPos);
        yPos += (splitOption.length * 6) + 2;
      });
      yPos += 5;
    } else {
      // Writing lines for text answers
      yPos += 5;
      doc.setDrawColor(200); // Light grey lines
      doc.line(margin, yPos, maxLineWidth + margin, yPos);
      yPos += 8;
      doc.line(margin, yPos, maxLineWidth + margin, yPos);
      yPos += 10;
    }
    
    yPos += 5; // Spacing
  });

  doc.save("CogniGen_Question_Paper.pdf");
};

// --- Function 2: Answer Key (Answers + Sources) ---
export const generateAnswerKey = (questions, title = "Answer Key") => {
  let { doc, pageHeight, margin, maxLineWidth, yPos } = createDoc(title);

  questions.forEach((q, index) => {
    // Check page break
    if (yPos + 30 >= pageHeight - margin) {
      doc.addPage();
      yPos = 20;
    }

    // Reference
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Q${index + 1}`, margin, yPos);

    // Answer
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 100, 0); // Green color for answers
    const answerText = `Answer: ${q.answer}`;
    const splitAnswer = doc.splitTextToSize(answerText, maxLineWidth - 15);
    doc.text(splitAnswer, margin + 15, yPos);
    yPos += (splitAnswer.length * 6) + 2;

    // Source
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100); // Grey color for source
    
    const bookName = q.source_book_name || "Book";
    const chapter = q.source_chapter || "?";
    const page = q.source_book_page || "?";
    
    const sourceInfo = `Source: ${bookName} (Ch: ${chapter}, Pg: ${page})`;
    const splitSource = doc.splitTextToSize(sourceInfo, maxLineWidth - 15);
    doc.text(splitSource, margin + 15, yPos);
    
    yPos += (splitSource.length * 6) + 8; // Extra spacing
  });

  doc.save("CogniGen_Answer_Key.pdf");
};