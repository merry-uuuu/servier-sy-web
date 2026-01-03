import { GetServerSideProps } from "next";
import { cls } from "@/libs/client/utils";
import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";

type AdminDashboardProps = {
  title?: string;
  subtitle?: string;
};

interface UploadedFile {
  name: string;
  data: string[][];
}

// 업로드 및 시트 생성에 허용된 순서 정의
const ALLOWED_SHEET_ORDER = [
  "DEMO",
  "HIST_E",
  "PARENT",
  "EVENT",
  "TEST",
  "DRUG",
  "DRUG1",
  "DRUG2",
  "DRUG3",
  "DRUG_EVENT",
  "ASSESSMENT",
  "GROUP",
];
const ALLOWED_SHEET_SET = new Set(ALLOWED_SHEET_ORDER);

// DEMO 시트 전용: 헤더 변경 및 값 변환
const DEMO_HEADER_RENAMES: Record<string, string> = {
  DEPT_RECEIPT_NO: "MFDS_RECEIPT_NO",
  SFRPNO: "MANUF_CASE_NO",
  RPT_DL_DT: "SUBMISSION DATE TO CA",
  RPT_TY: "REPORT_TYPE",
  ADRSE_STUDY_TYP: "STUDY_TYPE",
  ADRSE_STUDY_LWPRT_TYP: "STUDY TYPE_DETAIL",
  LTRTRE_INFO: "LITERATURE_INFO",
  CLIENT_STUDY_NO: "STUDY_PROTOCOL_NO",
  FIRST_OCCR_DT: "INITIAL_RECEIPT_DATE",
  RECENT_OCCR_DT: "RECENT_RECEIPT_DATE",
  QCK_RPT_YN: "EXPEDITED",
  SFRPNO_2: "CASE_NO_OF_REFERENCE_REPORT",
  REPRT_CHANGE_CD: "NULLIFICATION_AMENDMENT",
  PRMRPT_TY: "PRIMARY_REPORTER",
  PRMRPT_LWPRT_CD: "PRIMARY_REPORTER_OTHER_HCP",
  SENDER_TY: "SENDER_TYPE",
  SENDER_TY_MED_EXPERT: "SENDER_TYPE_HCP DETAIL",
  PTNT_OCCURSYMT_AGE: "PATIENT AGE AT OCCURRENCE",
  PTNT_OCCURSYMT_AGE_UNIT: "PATIENT AGE AT OCCURRENCE_UNIT",
  PTNT_AGRDE: "PATIENT AGE GROUP",
  PTNT_BRTYR_YYYY: "PATIENT BIRTH YEAR",
  PTNT_SEX: "PATIENT SEX",
  PTNT_WEIGHT: "PATIENT WEIGHT",
  PTNT_HEIGHT: "PATIENT HEIGHT",
  OCCURSYMT_PREG_TRM: "PREGNANCY_TERM_OCCURRENCE",
  OCCURSYMT_PREG_TRM_UNIT: "PREGNANCY_TERM_OCCURRENCE_UNIT",
};

const REPORT_TYPE_MAP: Record<string, string> = {
  "1": "Spontaneous",
  "2": "Clinical trial/study",
  "3": "Others",
};

const STUDY_TYPE_MAP: Record<string, string> = {
  "1": "Clinical trial",
  "2": "Individual patient use",
  "3": "Other study",
};

const STUDY_TYPE_DETAIL_MAP: Record<string, string> = {
  "1": "Re-examination-Post-marketing surveillance",
  "2": "Re-examination-Post-marketing clinical study",
  "3": "Re-examination-Special investigation",
  "4": "Others",
};

const NULLIFICATION_AMENDMENT_MAP: Record<string, string> = {
  "1": "Delete",
  "2": "Amendment",
};

const PRIMARY_REPORTER_MAP: Record<string, string> = {
  "1": "Doctor, Dentist, Oriental doctor",
  "2": "Pharmacist, Herbal pharmacist",
  "3": "Other HCP",
  "4": "Lawyer",
  "5": "Consumer or other non-HCP",
  UNK: "Unknown",
};

const PRIMARY_REPORTER_OTHER_HCP_MAP: Record<string, string> = {
  "1": "Nurse",
  "2": "Others",
};

const SENDER_TYPE_MAP: Record<string, string> = {
  "1": "Pharmaceutical company",
  "2": "Competent authority",
  "3": "HCP",
  "4": "Regional pharmacovigilance center",
  "5": "WHO Uppsala Monitoring Centre",
  "6": "Others(eg. Distributor or other organization)",
  "7": "Patient/consumer",
};

const SENDER_TYPE_HCP_DETAIL_MAP: Record<string, string> = {
  "1": "Hospital",
  "2": "Pharmacy",
  "3": "Public health center",
  "4": "Others",
};

const PATIENT_AGE_AT_OCCURRENCE_UNIT_MAP: Record<string, string> = {
  "00105": "hours",
  "00107": "days",
  "00108": "weeks",
  "00106": "months",
  "00103": "years",
  "00009": "decades",
};

const PATIENT_AGE_GROUP_MAP: Record<string, string> = {
  "0": "fetus",
  "1": "newborn(birth date~less than 28days)",
  "2": "infant(28days~less than 24 months)",
  "3": "children(24months~less than 12  years old)",
  "4": "adolescent(12 years~less than 19 years old)",
  "5": "adult(19 years~less than 65 years old)",
  "6": "geriatrics(more than 65 years old)",
};

const PATIENT_SEX_MAP: Record<string, string> = {
  "1": "male",
  "2": "female",
};

const PREGNANCY_TERM_OCCURRENCE_UNIT_MAP: Record<string, string> = {
  "00109": "seconds",
  "00104": "minutes",
  "00105": "hours",
  "00107": "days",
  "00108": "weeks",
  "00106": "months",
  "00103": "years",
  "00009": "decades",
  "00010": "trimester",
  "00011": "periodically",
  "00012": "if necessary",
  "00013": "total",
};

export default function AdminDashboard({
  title,
  subtitle,
}: AdminDashboardProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파이프 구분자로 파싱
  const parseAsciiFile = (content: string): string[][] => {
    const lines = content.split("\n").filter((line) => line.trim() !== "");
    return lines.map((line) => line.split("|").map((cell) => cell.trim()));
  };

  // 파일명에서 확장자 제거 (탭 이름용)
  const getFileNameWithoutExtension = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) return fileName;
    return fileName.substring(0, lastDotIndex);
  };

  // 파일 처리
  const processFiles = useCallback(async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      try {
        const content = await file.text();
        const data = parseAsciiFile(content);
        const nameWithoutExt = getFileNameWithoutExtension(file.name);
        if (!ALLOWED_SHEET_SET.has(nameWithoutExt)) {
          continue;
        }

        const processedData =
          nameWithoutExt === "DEMO" ? transformDemoSheet(data) : data;

        newFiles.push({
          name: nameWithoutExt,
          data: processedData,
        });
      } catch (error) {
        console.error(`파일 처리 오류: ${file.name}`, error);
      }
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setIsProcessing(false);
  }, []);

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // input 초기화 (같은 파일 다시 선택 가능하게)
    e.target.value = "";
  };

  // 드래그 앤 드롭 핸들러
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // 엑셀 다운로드
  const downloadExcel = () => {
    if (uploadedFiles.length === 0) return;

    const workbook = XLSX.utils.book_new();

    // 허용된 이름만 순서대로 시트 생성
    ALLOWED_SHEET_ORDER.forEach((sheetName) => {
      const file = [...uploadedFiles]
        .reverse()
        .find((f) => f.name === sheetName);
      if (!file) return;

      let finalSheetName = sheetName.substring(0, 31);
      let counter = 1;
      while (workbook.SheetNames.includes(finalSheetName)) {
        const suffix = `_${counter}`;
        finalSheetName = sheetName.substring(0, 31 - suffix.length) + suffix;
        counter++;
      }

      const worksheet = XLSX.utils.aoa_to_sheet(file.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, finalSheetName);
    });

    // 다운로드
    XLSX.writeFile(workbook, "통합_데이터.xlsx");
  };

  // 파일 삭제
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 전체 초기화
  const clearAll = () => {
    setUploadedFiles([]);
  };

  // DEMO 시트 전용 변환: 헤더 이름 변경 + REPORT_TYPE 값 매핑
  const transformDemoSheet = (data: string[][]): string[][] => {
    if (data.length === 0) return data;

    const [header, ...rows] = data;
    const renamedHeader = header.map((col) => DEMO_HEADER_RENAMES[col] ?? col);
    const reportTypeIndex = renamedHeader.findIndex(
      (col) => col === "REPORT_TYPE"
    );
    const studyTypeIndex = renamedHeader.findIndex(
      (col) => col === "STUDY_TYPE"
    );
    const studyTypeDetailIndex = renamedHeader.findIndex(
      (col) => col === "STUDY TYPE_DETAIL"
    );
    const nullificationAmendmentIndex = renamedHeader.findIndex(
      (col) => col === "NULLIFICATION_AMENDMENT"
    );
    const primaryReporterIndex = renamedHeader.findIndex(
      (col) => col === "PRIMARY_REPORTER"
    );
    const primaryReporterOtherIndex = renamedHeader.findIndex(
      (col) => col === "PRIMARY_REPORTER_OTHER_HCP"
    );
    const senderTypeIndex = renamedHeader.findIndex(
      (col) => col === "SENDER_TYPE"
    );
    const senderTypeHcpDetailIndex = renamedHeader.findIndex(
      (col) => col === "SENDER_TYPE_HCP DETAIL"
    );
    const patientAgeAtOccurrenceUnitIndex = renamedHeader.findIndex(
      (col) => col === "PATIENT AGE AT OCCURRENCE_UNIT"
    );
    const patientAgeGroupIndex = renamedHeader.findIndex(
      (col) => col === "PATIENT AGE GROUP"
    );
    const patientSexIndex = renamedHeader.findIndex(
      (col) => col === "PATIENT SEX"
    );
    const pregnancyTermOccurrenceUnitIndex = renamedHeader.findIndex(
      (col) => col === "PREGNANCY_TERM_OCCURRENCE_UNIT"
    );

    const transformedRows = rows.map((row) => {
      const newRow = [...row];
      if (reportTypeIndex !== -1 && reportTypeIndex < row.length) {
        const rawValue = row[reportTypeIndex];
        newRow[reportTypeIndex] = REPORT_TYPE_MAP[rawValue] ?? rawValue;
      }
      if (studyTypeIndex !== -1 && studyTypeIndex < row.length) {
        const rawValue = row[studyTypeIndex];
        newRow[studyTypeIndex] = STUDY_TYPE_MAP[rawValue] ?? rawValue;
      }
      if (studyTypeDetailIndex !== -1 && studyTypeDetailIndex < row.length) {
        const rawValue = row[studyTypeDetailIndex];
        newRow[studyTypeDetailIndex] =
          STUDY_TYPE_DETAIL_MAP[rawValue] ?? rawValue;
      }
      if (
        nullificationAmendmentIndex !== -1 &&
        nullificationAmendmentIndex < row.length
      ) {
        const rawValue = row[nullificationAmendmentIndex];
        newRow[nullificationAmendmentIndex] =
          NULLIFICATION_AMENDMENT_MAP[rawValue] ?? rawValue;
      }
      if (primaryReporterIndex !== -1 && primaryReporterIndex < row.length) {
        const rawValue = row[primaryReporterIndex];
        newRow[primaryReporterIndex] =
          PRIMARY_REPORTER_MAP[rawValue] ?? rawValue;
      }
      if (
        primaryReporterOtherIndex !== -1 &&
        primaryReporterOtherIndex < row.length
      ) {
        const rawValue = row[primaryReporterOtherIndex];
        newRow[primaryReporterOtherIndex] =
          PRIMARY_REPORTER_OTHER_HCP_MAP[rawValue] ?? rawValue;
      }
      if (senderTypeIndex !== -1 && senderTypeIndex < row.length) {
        const rawValue = row[senderTypeIndex];
        newRow[senderTypeIndex] = SENDER_TYPE_MAP[rawValue] ?? rawValue;
      }
      if (
        senderTypeHcpDetailIndex !== -1 &&
        senderTypeHcpDetailIndex < row.length
      ) {
        const rawValue = row[senderTypeHcpDetailIndex];
        newRow[senderTypeHcpDetailIndex] =
          SENDER_TYPE_HCP_DETAIL_MAP[rawValue] ?? rawValue;
      }
      if (
        patientAgeAtOccurrenceUnitIndex !== -1 &&
        patientAgeAtOccurrenceUnitIndex < row.length
      ) {
        const rawValue = row[patientAgeAtOccurrenceUnitIndex];
        newRow[patientAgeAtOccurrenceUnitIndex] =
          PATIENT_AGE_AT_OCCURRENCE_UNIT_MAP[rawValue] ?? rawValue;
      }
      if (patientAgeGroupIndex !== -1 && patientAgeGroupIndex < row.length) {
        const rawValue = row[patientAgeGroupIndex];
        newRow[patientAgeGroupIndex] =
          PATIENT_AGE_GROUP_MAP[rawValue] ?? rawValue;
      }
      if (patientSexIndex !== -1 && patientSexIndex < row.length) {
        const rawValue = row[patientSexIndex];
        newRow[patientSexIndex] = PATIENT_SEX_MAP[rawValue] ?? rawValue;
      }
      if (
        pregnancyTermOccurrenceUnitIndex !== -1 &&
        pregnancyTermOccurrenceUnitIndex < row.length
      ) {
        const rawValue = row[pregnancyTermOccurrenceUnitIndex];
        newRow[pregnancyTermOccurrenceUnitIndex] =
          PREGNANCY_TERM_OCCURRENCE_UNIT_MAP[rawValue] ?? rawValue;
      }
      return newRow;
    });

    return [renamedHeader, ...transformedRows];
  };

  return (
    <div className={cls("text-gray-900")}>
      {/* 파일 업로드 영역 */}
      <div
        className={cls(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          dragActive
            ? "border-black bg-gray-100"
            : "border-gray-300 hover:border-gray-400"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.csv,.dat"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="mb-3">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-gray-600 mb-1">
          <span className="font-semibold text-black">클릭하여 파일 선택</span>{" "}
          또는 드래그 앤 드롭
        </p>
        <p className="text-sm text-gray-500">
          파이프(|) 구분자 형식의 텍스트 파일 (.txt, .csv, .dat)
        </p>
      </div>

      {/* 처리 중 표시 */}
      {isProcessing && (
        <div className="mt-4 text-center text-gray-600">
          <span className="inline-block animate-spin mr-2">⏳</span>
          파일 처리 중...
        </div>
      )}

      {/* 업로드된 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              업로드된 파일 ({uploadedFiles.length}개)
            </h3>
            <div className="flex gap-2">
              <button
                onClick={clearAll}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                전체 삭제
              </button>
              <button
                onClick={downloadExcel}
                className="px-4 py-1.5 text-sm text-white bg-black rounded-md hover:bg-gray-900"
              >
                엑셀 다운로드
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {file.data.length}행 × {file.data[0]?.length || 0}열
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<
  AdminDashboardProps
> = async () => {
  return {
    props: {
      title: "파일 변환",
      subtitle: "파이프(|) 구분자 파일을 엑셀로 변환합니다.",
    },
  };
};
