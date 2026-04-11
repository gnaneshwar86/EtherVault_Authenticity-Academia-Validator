from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from doctr.io import DocumentFile
from doctr.models import ocr_predictor
import re

app = FastAPI(title="DocTR Certificate Extraction Service")

# Load DocTR globally to keep the ML model cached in memory
print("Loading DocTR models...")
model = ocr_predictor(det_arch='db_resnet50', reco_arch='crnn_vgg16_bn', pretrained=True)
print("DocTR models loaded successfully.")

@app.post("/extract")
async def extract_certificate(file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        # Parse document file based on type
        if file.filename.lower().endswith(".pdf"):
            doc = DocumentFile.from_pdf(content)
        else:
            doc = DocumentFile.from_images(content)

        # Run model
        result = model(doc)

        # Reconstruct text line by line
        lines = []
        for page in result.pages:
            for block in page.blocks:
                for line in block.lines:
                    words = [word.value for word in line.words]
                    lines.append(" ".join(words))

        full_text = "\n".join(lines)
        print("===== RAW EXTRACTED TEXT FROM DOCTR =====")
        print(full_text)

        # Apply robust regex logic to extracted text
        data = parse_certificate_text(full_text)
        
        return JSONResponse(content={
            "success": True,
            "raw_text": full_text,
            "extracted_data": data
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


def parse_certificate_text(text: str) -> dict:
    data = {}
    # Basic cleaning of the full text to remove redundant whitespace while preserving lines
    text = "\n".join([L.strip() for L in text.split("\n")])
    lines = text.split("\n")

    def extract_field(regex, ignore_case=True):
        flags = re.MULTILINE
        if ignore_case: flags |= re.IGNORECASE
        match = re.search(regex, text, flags)
        return match.group(1).strip() if match else ""

    # --- Student Name Extraction ---
    # We remove IGNORE_CASE here to stop at "for" (lowercase) if name is uppercase
    name_raw = extract_field(r"(?:presented to|awarded to|This is to certify that|Name of the Student)\s*\n*\s*([A-Z\s\.]{3,})", ignore_case=False)
    
    # Fallback to general search if uppercase not found
    if not name_raw or len(name_raw) < 3:
        # Stop at newline or common stop words
        name_raw = extract_field(r"(?:Student Name|Name|Candidate Name)\s*[:\-]?\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)+|[A-Z\s\.]{3,})")
        # Ensure we stop if we see "for" or "successfully"
        if name_raw:
            name_raw = re.split(r"\b(?:for|successfully|degree|on)\b", name_raw, flags=re.IGNORECASE)[0].strip()

    data["studentName"] = clean_extracted(name_raw, "studentName") if name_raw else ""

    # --- Degree & Branch Extraction ---
    # Look for "degree of" label and capture the rest of the line
    degree_line = ""
    for i, line in enumerate(lines):
        match = re.search(r"(?:degree of|course in|Program|Exam|Qualification)\s+[:\-]?\s*(.*)$", line, re.IGNORECASE)
        if match:
            degree_line = match.group(1).strip()
            # If nothing on current line, look at next
            if not degree_line and i + 1 < len(lines):
                degree_line = lines[i+1]
            elif i + 1 < len(lines) and lines[i+1].lower().startswith("in "):
                degree_line += " " + lines[i+1]
            break

    degree_name, branch = "", ""
    if degree_line:
        # Split at "in" or "branch of"
        parts = re.split(r"\s+\bin\b\s+|\s+\bbranch\b\s+", degree_line, flags=re.IGNORECASE)
        degree_name = parts[0].strip()
        branch = parts[1].strip() if len(parts) > 1 else ""
    
    if not degree_name:
        degree_name = extract_field(r"(?:Degree Name|Degree|Qualification)\s*[:\-]?\s*([^\n]+)")
    data["degreeName"] = clean_extracted(degree_name, "degreeName") if degree_name else ""

    if not branch:
        branch = extract_field(r"(?:Branch|Major|Specialization|Department|Stream)\s*[:\-]?\s*([^\n]+)")
    data["branch"] = clean_extracted(branch, "branch") if branch else ""

    # --- University/Institution Extraction ---
    # Capture University until "Issued By" or newline
    uni = extract_field(r"(?:University|University Name|Institute|Institution)\s*[:\-]?\s*([^\n]+)")
    if uni:
        uni = re.split(r"\b(?:Issued|Dated|on|By)\b", uni, flags=re.IGNORECASE)[0].strip()
    
    if not uni or len(uni) < 5:
        # Search for lines containing these keywords
        for L in lines:
            if any(k in L.upper() for k in ["UNIVERSITY", "INSTITUTE", "COLLEGE", "ACADEMY"]):
                if "Issued" in L: L = L.split("Issued")[0]
                uni = L
                break
    
    data["universityName"] = clean_extracted(uni, "universityName") if uni else ""

    # --- Register Number Extraction ---
    # We restrict the capture to avoid grabbing "CGPA" or other labels on the same/next line
    reg_no = extract_field(r"(?:Roll Number|Register Number|Roll No|Reg No|ID|Regd?\.?\s*No|PRN)\s*[:\-]?\s*([A-Za-z0-9\s\-]+)")
    if reg_no:
        # Split at common stop-words for ID fields
        reg_no = re.split(r"\s+\b(?:CGPA|GPA|SGPA|Year|DOB)\b", reg_no, flags=re.IGNORECASE)[0].strip()
    data["registerNumber"] = clean_extracted(reg_no, "registerNumber") if reg_no else ""

    # --- Static Fields ---
    data["yearOfPassing"] = extract_field(r"(?:Year of Graduation|Year of Passing|Year|Batch)\s*[:\-]?\s*(\d{4})") or ""
    data["certificateNumber"] = extract_field(r"(?:Certificate Number|Cert No|Sl\.?\s*No|Serial No)\s*[:\-]?\s*([A-Z0-9\-]{5,})") or ""
    
    # --- Date Normalization ---
    date_str = extract_field(r"(?:Date of Issue|Issue Date|Issued on|Date|Dated)\s*[:\-]?\s*(\d{1,4}[\-/]\d{1,2}[\-/]\d{1,4})")
    if date_str:
        if m := re.search(r"(\d{1,2})[\-/](\d{1,2})[\-/](\d{4})", date_str):
            data["dateOfIssue"] = f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
        else:
            data["dateOfIssue"] = date_str
    else:
        data["dateOfIssue"] = ""

    return data

def clean_extracted(val: str, field_name: str = "") -> str:
    if not val: return ""
    
    # Generic cleanup of noisy prefixes/labels inside the value
    labels_to_strip = [r"^Name\s*:", r"^Degree\s*:", r"^University\s*:", r"^Branch\s*:"]
    for label in labels_to_strip:
        val = re.sub(label, "", val, flags=re.IGNORECASE).strip()

    # Remove trailing/leading punctuation
    val = re.sub(r"^[^\w\(]+", "", val)
    val = re.sub(r"[^\w\)]+$", "", val)
    
    # Special cleaning for Register Number: remove all spaces
    if field_name == "registerNumber":
        val = re.sub(r"\s+", "", val).upper()
        return val

    # Special constraint for studentName: handle initials and descriptive text
    if field_name == "studentName":
        # Replace punctuation/dots with spaces first
        val = re.sub(r"[\.\-]", " ", val)
        
        # De-concatenate initials (e.g., RL -> R L, ABC -> A B C)
        # We loop to handle multiple consecutive initials
        for _ in range(3):
            # Matches cases like "RL" at the end of a string or after a space
            val = re.sub(r"(\b[A-Z])([A-Z]\b)", r"\1 \2", val)
            # Matches cases like "R L" just in case there are multiple spaces
            val = re.sub(r"(\b[A-Z])\s+([A-Z]\b)", r"\1 \2", val)
            # Lookbehind to catch initials starting after a space but not a boundary
            val = re.sub(r"(?<=\s)([A-Z])([A-Z]\b)", r"\1 \2", val)

        # Remove anything after common stop-words
        val = re.split(r"\b(?:for|successfully|completing|degree)\b", val, flags=re.IGNORECASE)[0].strip()

    # Special constraint for universityName: remove "Issued By" content
    if field_name == "universityName":
        val = re.split(r"\b(?:Issued|By|Sign)\b", val, flags=re.IGNORECASE)[0].strip()

    # Collapse multiple spaces to one, preserving spaces between initials
    return " ".join(val.split())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
