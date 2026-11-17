// Tiny PDF writer for synthetic local document previews, using the built-in PDF font.
export function createSamplePdf(lines: string[]) {
  const escape = (text: string) => text.replace(/[^\x20-\x7e]/g, " ").replace(/[\\()]/g, "\\$&");
  const stream = `BT /F1 12 Tf 54 750 Td 22 TL ${lines.map((line,index) => `${index ? "T* " : ""}(${escape(line)}) Tj`).join("\n")} ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let content = "%PDF-1.4\n";
  const offsets = [0];
  // All text is escaped to ASCII above, so character and byte offsets agree.
  objects.forEach((object,index) => { offsets.push(content.length); content += `${index+1} 0 obj\n${object}\nendobj\n`; });
  const start = content.length;
  content += `xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => String(offset).padStart(10,"0")+" 00000 n \n").join("")}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return new TextEncoder().encode(content);
}
