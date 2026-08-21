import { downloadCSV, downloadPDF } from "../../api/reportApi";

export default function ExportButtons() {
  return (
    <div className="flex gap-4">
      <button onClick={downloadCSV} className="bg-green-600 text-white px-5 py-2 rounded">
        Download CSV
      </button>
      <button onClick={downloadPDF} className="bg-red-600 text-white px-5 py-2 rounded">
        Download PDF
      </button>
    </div>
  );
}
