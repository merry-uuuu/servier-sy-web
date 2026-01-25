import { GetServerSideProps } from "next";
import { cls } from "@/libs/client/utils";
import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx-js-style";
import {
  DEMO_HEADER_RENAMES,
  REPORT_TYPE_MAP,
  STUDY_TYPE_MAP,
  STUDY_TYPE_DETAIL_MAP,
  NULLIFICATION_AMENDMENT_MAP,
  PRIMARY_REPORTER_MAP,
  PRIMARY_REPORTER_OTHER_HCP_MAP,
  SENDER_TYPE_MAP,
  SENDER_TYPE_HCP_DETAIL_MAP,
  PATIENT_AGE_AT_OCCURRENCE_UNIT_MAP,
  PATIENT_AGE_GROUP_MAP,
  PATIENT_SEX_MAP,
  PREGNANCY_TERM_OCCURRENCE_UNIT_MAP,
} from "@/libs/client/trans/1_DEMO";
import {
  PARENT_HEADER_RENAMES,
  PARENT_AGE_UNIT_MAP,
  PARENT_SEX_MAP,
} from "@/libs/client/trans/3_PARENT";
import {
  ADR_OUTCOME_MAP,
  EVENT_HEADER_RENAMES,
} from "@/libs/client/trans/4_EVENT";
import {
  TEST_HEADER_RENAMES,
  TEST_RESULT_MAP,
} from "@/libs/client/trans/5_TEST";
import {
  DRUG_ACTION_TAKEN_MAP,
  DRUG_GROUP_MAP,
  DRUG_HEADER_RENAMES,
} from "@/libs/client/trans/6_DRUG";
import {
  DRUG_EVENT_HEADER_RENAMES,
  RECHALLENGE_ADR_REOCCUR_MAP,
} from "@/libs/client/trans/10_DRUG_EVENT";
import {
  ASSESSMENT_HEADER_RENAMES,
  CAUSALITY_ASSESSMENT_MAP,
} from "@/libs/client/trans/11_ASSESSMENT";

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
  "README",
];
const ALLOWED_SHEET_SET = new Set(ALLOWED_SHEET_ORDER);
const HEADER_FILL_COLOR = "71AD47";
const DRUG_CODE_CSV_PATH = "/templates/의약품품목코드.csv";
const DOSAGE_UNIT_CSV_PATH = "/templates/투여량 단위.csv";
const INGREDIENT_CODE_CSV_PATH = "/templates/의약품성분코드.csv";
const EDQM_CODE_CSV_PATH = "/templates/EDQM코드.csv";
const KCD7_CSV_PATH = "/templates/KCD7차.csv";
const KCD8_CSV_PATH = "/templates/KCD8차.csv";
const WHOART_CODE_CSV_PATH = "/templates/ WHOART 코드집.csv";

let drugCodeMapPromise: Promise<Map<string, string>> | null = null;
let dosageUnitMapPromise: Promise<Map<string, string>> | null = null;
let ingredientCodeMapPromise: Promise<Map<string, string>> | null = null;
let edqmDrugShapeMapPromise: Promise<Map<string, string>> | null = null;
let edqmDosageRouteMapPromise: Promise<Map<string, string>> | null = null;
let kcd7MapPromise: Promise<Map<string, string>> | null = null;
let kcd8MapPromise: Promise<Map<string, string>> | null = null;
let whoartEnglishMapPromise: Promise<Map<string, string>> | null = null;

const loadDrugCodeMap = async () => {
  if (!drugCodeMapPromise) {
    drugCodeMapPromise = (async () => {
      const response = await fetch(DRUG_CODE_CSV_PATH);
      if (!response.ok) {
        throw new Error("의약품품목코드.csv를 불러오지 못했습니다.");
      }
      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
      }) as string[][];

      const map = new Map<string, string>();
      rows.slice(1).forEach((row) => {
        const code = row[0]?.toString().trim();
        const name = row[1]?.toString().trim();
        if (!code || !name) return;
        map.set(code, name);
      });

      return map;
    })();
  }

  return drugCodeMapPromise;
};

const loadDosageUnitMap = async () => {
  if (!dosageUnitMapPromise) {
    dosageUnitMapPromise = (async () => {
      const response = await fetch(DOSAGE_UNIT_CSV_PATH);
      if (!response.ok) {
        throw new Error("투여량 단위.csv를 불러오지 못했습니다.");
      }
      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
      }) as string[][];

      const map = new Map<string, string>();
      rows.forEach((row) => {
        const code = row[0]?.toString().trim();
        const value = row[2]?.toString().trim();
        if (!code || !value) return;
        map.set(code, value);
      });

      return map;
    })();
  }

  return dosageUnitMapPromise;
};

const loadIngredientCodeMap = async () => {
  if (!ingredientCodeMapPromise) {
    ingredientCodeMapPromise = (async () => {
      const response = await fetch(INGREDIENT_CODE_CSV_PATH);
      if (!response.ok) {
        throw new Error("의약품성분코드.csv를 불러오지 못했습니다.");
      }
      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
      }) as string[][];

      const map = new Map<string, string>();
      rows.slice(1).forEach((row) => {
        const code = row[0]?.toString().trim();
        const value = row[2]?.toString().trim();
        if (!code || !value) return;
        map.set(code, value);
      });

      return map;
    })();
  }

  return ingredientCodeMapPromise;
};

const loadEdqmDrugShapeMap = async () => {
  if (!edqmDrugShapeMapPromise) {
    edqmDrugShapeMapPromise = (async () => {
      const response = await fetch(EDQM_CODE_CSV_PATH);
      if (!response.ok) {
        throw new Error("EDQM코드.csv를 불러오지 못했습니다.");
      }
      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
      }) as string[][];

      const map = new Map<string, string>();
      rows.slice(3).forEach((row) => {
        const code = row[1]?.toString().trim();
        const name = row[2]?.toString().trim();
        if (!code || !name) return;
        map.set(code, name);
      });

      return map;
    })();
  }

  return edqmDrugShapeMapPromise;
};

const loadEdqmDosageRouteMap = async () => {
  if (!edqmDosageRouteMapPromise) {
    edqmDosageRouteMapPromise = (async () => {
      const response = await fetch(EDQM_CODE_CSV_PATH);
      if (!response.ok) {
        throw new Error("EDQM코드.csv를 불러오지 못했습니다.");
      }
      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
      }) as string[][];

      const map = new Map<string, string>();
      rows.slice(3).forEach((row) => {
        const code = row[4]?.toString().trim();
        const name = row[5]?.toString().trim();
        if (!code || !name) return;
        map.set(code, name);
      });

      return map;
    })();
  }

  return edqmDosageRouteMapPromise;
};

const loadKcdMap = async (version: "7" | "8") => {
  if (version === "7") {
    if (!kcd7MapPromise) {
      kcd7MapPromise = (async () => {
        const response = await fetch(KCD7_CSV_PATH);
        if (!response.ok) {
          throw new Error("KCD7차.csv를 불러오지 못했습니다.");
        }
        const csvText = await response.text();
        const workbook = XLSX.read(csvText, { type: "string" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          blankrows: false,
        }) as string[][];

        const map = new Map<string, string>();
        rows.slice(1).forEach((row) => {
          const code = row[0]?.toString().trim();
          const value = row[2]?.toString().trim();
          if (!code || !value) return;
          map.set(code, value);
        });

        return map;
      })();
    }
    return kcd7MapPromise;
  }

  if (!kcd8MapPromise) {
    kcd8MapPromise = (async () => {
      const response = await fetch(KCD8_CSV_PATH);
      if (!response.ok) {
        throw new Error("KCD8차.csv를 불러오지 못했습니다.");
      }
      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
      }) as string[][];

      const map = new Map<string, string>();
      rows.slice(1).forEach((row) => {
        const code = row[0]?.toString().trim();
        const value = row[2]?.toString().trim();
        if (!code || !value) return;
        map.set(code, value);
      });

      return map;
    })();
  }

  return kcd8MapPromise;
};

const loadWhoartEnglishMap = async () => {
  if (!whoartEnglishMapPromise) {
    whoartEnglishMapPromise = (async () => {
      const response = await fetch(WHOART_CODE_CSV_PATH);
      if (!response.ok) {
        throw new Error("WHOART 코드집.csv를 불러오지 못했습니다.");
      }
      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
      }) as string[][];

      const map = new Map<string, string>();
      rows.slice(2).forEach((row) => {
        const arrn = row[0]?.toString().trim();
        const seq = row[1]?.toString().trim();
        const english = row[6]?.toString().trim();
        if (!arrn || !seq || !english) return;
        map.set(`${arrn}|${seq}`, english);
      });

      return map;
    })();
  }

  return whoartEnglishMapPromise;
};

export default function AdminDashboard({
  title,
  subtitle,
}: AdminDashboardProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [kcdVersion, setKcdVersion] = useState<"7" | "8" | "">("");
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
          nameWithoutExt === "DEMO"
            ? transformDemoSheet(data)
            : nameWithoutExt === "HIST_E"
            ? transformHistESheet(data)
            : nameWithoutExt === "PARENT"
            ? transformParentSheet(data)
            : nameWithoutExt === "EVENT"
            ? await transformEventSheet(data)
            : nameWithoutExt === "TEST"
            ? transformTestSheet(data)
            : nameWithoutExt === "DRUG"
            ? await transformDrugSheet(data)
            : nameWithoutExt === "DRUG1"
            ? await transformDrug1Sheet(data)
            : nameWithoutExt === "DRUG2"
            ? await transformDrug2Sheet(data)
            : nameWithoutExt === "DRUG3"
            ? await transformDrug3Sheet(data)
            : nameWithoutExt === "DRUG_EVENT"
            ? transformDrugEventSheet(data)
            : nameWithoutExt === "ASSESSMENT"
            ? transformAssessmentSheet(data)
            : data;

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
    if (uploadedFiles.some((file) => file.name === "DRUG3") && !kcdVersion) {
      alert("KCD 7차 또는 8차를 선택해 주세요.");
      return;
    }

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
      worksheet["!cols"] = calcAutoCols(file.data);
      applyHeaderStyle(worksheet);
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

  const applyHeaderStyle = (worksheet: XLSX.WorkSheet) => {
    const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1");
    const headerRowIndex = 0;

    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c });
      const cell = worksheet[cellAddress];
      if (!cell) continue;
      cell.s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: HEADER_FILL_COLOR },
        },
        font: {
          color: { rgb: "FFFFFF" },
        },
      };
    }
  };

  const calcAutoCols = (
    rows: Array<Array<string | number | null | undefined>>
  ): XLSX.ColInfo[] => {
    const maxLens: number[] = [];

    rows.forEach((row) => {
      row.forEach((cell, i) => {
        const len = String(cell ?? "").length;
        maxLens[i] = Math.max(maxLens[i] ?? 0, len);
      });
    });

    return maxLens.map((len) => ({ wch: Math.min(len + 5, 10000) }));
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

  // HIST_E 시트 전용 변환: 헤더 보정 + 누락 컬럼 추가
  const transformHistESheet = (data: string[][]): string[][] => {
    if (data.length === 0) return data;

    const targetHeader = [
      "KAERS_NO",
      "PATIENT_HISTORY_MEDDRA_KOR",
      "PATIENT_HISTORY_MEDDRA_ENG",
      "PATIENT_HISTORY_START_DATE",
      "PATIENT_HIST_END_DATE",
    ];

    const [, ...rows] = data;
    const transformedRows = rows.map((row) => {
      const base = row.slice(0, 3);
      while (base.length < 3) base.push("");
      return [...base, "", ""];
    });

    return [targetHeader, ...transformedRows];
  };

  // PARENT 시트 전용 변환: 헤더 이름 변경 + PARENT_AGE_UNIT 값 매핑
  const transformParentSheet = (data: string[][]): string[][] => {
    if (data.length === 0) return data;

    const [header, ...rows] = data;
    const renamedHeader = header.map(
      (col) => PARENT_HEADER_RENAMES[col] ?? col
    );
    const parentAgeUnitIndex = renamedHeader.findIndex(
      (col) => col === "PARENT_AGE_UNIT"
    );
    const parentSexIndex = renamedHeader.findIndex(
      (col) => col === "PARENT_SEX"
    );

    const transformedRows = rows.map((row) => {
      const newRow = [...row];
      if (parentAgeUnitIndex !== -1 && parentAgeUnitIndex < row.length) {
        const rawValue = row[parentAgeUnitIndex];
        newRow[parentAgeUnitIndex] = PARENT_AGE_UNIT_MAP[rawValue] ?? rawValue;
      }
      if (parentSexIndex !== -1 && parentSexIndex < row.length) {
        const rawValue = row[parentSexIndex];
        newRow[parentSexIndex] = PARENT_SEX_MAP[rawValue] ?? rawValue;
      }
      return newRow;
    });

    return [renamedHeader, ...transformedRows];
  };

  // EVENT 시트 전용 변환: 헤더 이름 변경 + ADR_OUTCOME 값 매핑 + ENGLISH TERM 열 추가
  const transformEventSheet = async (data: string[][]): Promise<string[][]> => {
    if (data.length === 0) return data;

    const [header, ...rows] = data;
    const renamedHeader = header.map((col) => EVENT_HEADER_RENAMES[col] ?? col);
    const adrOutcomeIndex = renamedHeader.findIndex(
      (col) => col === "ADR_OUTCOME"
    );
    const whoartArrnIndex = renamedHeader.findIndex(
      (col) => col === "WHOART_PT"
    );
    const whoartSeqIndex = renamedHeader.findIndex(
      (col) => col === "WHOART_IT"
    );
    const whoartEnglishMap = await loadWhoartEnglishMap();

    // WHOART_IT 다음 위치에 ENGLISH TERM 열 추가
    const englishTermInsertIndex = whoartSeqIndex !== -1 ? whoartSeqIndex + 1 : -1;
    const finalHeader = [...renamedHeader];
    if (englishTermInsertIndex !== -1) {
      finalHeader.splice(englishTermInsertIndex, 0, "ENGLISH TERM");
    }

    const transformedRows = rows.map((row) => {
      const newRow = [...row];

      // ADR_OUTCOME 값 매핑 (열 추가 전에 처리)
      if (adrOutcomeIndex !== -1 && adrOutcomeIndex < row.length) {
        const rawValue = row[adrOutcomeIndex];
        newRow[adrOutcomeIndex] = ADR_OUTCOME_MAP[rawValue] ?? rawValue;
      }

      // ENGLISH TERM 열 추가 및 값 계산
      if (englishTermInsertIndex !== -1 && whoartArrnIndex !== -1 && whoartSeqIndex !== -1) {
        const arrn = row[whoartArrnIndex]?.toString().trim() ?? "";
        const seq = row[whoartSeqIndex]?.toString().trim() ?? "";
        const key = `${arrn}|${seq}`;
        const englishTerm = (arrn && seq) ? (whoartEnglishMap.get(key) ?? "") : "";
        newRow.splice(englishTermInsertIndex, 0, englishTerm);
      }

      return newRow;
    });

    return [finalHeader, ...transformedRows];
  };

  // TEST 시트 전용 변환: 헤더 이름 변경 + TEST_RESULT 값 매핑
  const transformTestSheet = (data: string[][]): string[][] => {
    if (data.length === 0) return data;

    const [header, ...rows] = data;
    const renamedHeader = header.map((col) => TEST_HEADER_RENAMES[col] ?? col);
    const testResultIndex = renamedHeader.findIndex(
      (col) => col === "TEST_RESULT"
    );

    const transformedRows = rows.map((row) => {
      const newRow = [...row];
      if (testResultIndex !== -1 && testResultIndex < row.length) {
        const rawValue = row[testResultIndex];
        newRow[testResultIndex] = TEST_RESULT_MAP[rawValue] ?? rawValue;
      }
      return newRow;
    });

    return [renamedHeader, ...transformedRows];
  };

  // DRUG 시트 전용 변환: 헤더 이름 변경 + DRUG_GROUP 값 매핑
  const transformDrugSheet = async (data: string[][]): Promise<string[][]> => {
    if (data.length === 0) return data;

    const [header, ...rows] = data;
    const renamedHeader = header.map((col) => DRUG_HEADER_RENAMES[col] ?? col);
    const drugGroupIndex = renamedHeader.findIndex(
      (col) => col === "DRUG_GROUP"
    );
    const drugCodeIndex = renamedHeader.findIndex((col) => col === "DRUG_CODE");
    const accumulateDosageUnitIndex = renamedHeader.findIndex(
      (col) => col === "ACCUMULATE_DOSAGE_SINCE_ONSET_UNIT"
    );
    const drugActionTakenIndex = renamedHeader.findIndex(
      (col) => col === "DRUG_ACTION_TAKEN"
    );
    const drugCodeMap = await loadDrugCodeMap();
    const dosageUnitMap = await loadDosageUnitMap();

    const transformedRows = rows.map((row) => {
      const newRow = [...row];
      if (drugGroupIndex !== -1 && drugGroupIndex < row.length) {
        const rawValue = row[drugGroupIndex];
        newRow[drugGroupIndex] = DRUG_GROUP_MAP[rawValue] ?? rawValue;
      }
      if (drugCodeIndex !== -1 && drugCodeIndex < row.length) {
        const rawValue = row[drugCodeIndex]?.toString().trim();
        if (rawValue) {
          newRow[drugCodeIndex] = drugCodeMap.get(rawValue) ?? rawValue;
        }
      }
      if (
        accumulateDosageUnitIndex !== -1 &&
        accumulateDosageUnitIndex < row.length
      ) {
        const rawValue = row[accumulateDosageUnitIndex]?.toString().trim();
        if (rawValue) {
          newRow[accumulateDosageUnitIndex] =
            dosageUnitMap.get(rawValue) ?? rawValue;
        }
      }
      if (drugActionTakenIndex !== -1 && drugActionTakenIndex < row.length) {
        const rawValue = row[drugActionTakenIndex]?.toString().trim();
        if (rawValue) {
          newRow[drugActionTakenIndex] =
            DRUG_ACTION_TAKEN_MAP[rawValue] ?? rawValue;
        }
      }
      return newRow;
    });

    return [renamedHeader, ...transformedRows];
  };

  // DRUG1 시트 전용 변환: INGR_CD 값 VLOOKUP 치환
  const transformDrug1Sheet = async (data: string[][]): Promise<string[][]> => {
    if (data.length === 0) return data;

    const [header, ...rows] = data;
    const ingredientIndex = header.findIndex((col) => col === "INGR_CD");
    if (ingredientIndex === -1) return data;

    const ingredientMap = await loadIngredientCodeMap();
    const transformedRows = rows.map((row) => {
      const newRow = [...row];
      if (ingredientIndex < row.length) {
        // 열1의 값이 'MSK'이면 INGR_CD에도 'MSK' 입력
        const firstColumnValue = row[0]?.toString().trim();
        if (firstColumnValue === "MSK") {
          newRow[ingredientIndex] = "MSK";
        } else {
          const rawValue = row[ingredientIndex]?.toString().trim();
          if (rawValue) {
            newRow[ingredientIndex] = ingredientMap.get(rawValue) ?? rawValue;
          }
        }
      }
      return newRow;
    });

    return [header, ...transformedRows];
  };

  // DRUG2 시트 전용 변환: DOSAGE_QTY_UNIT 값 VLOOKUP 치환
  const transformDrug2Sheet = async (data: string[][]): Promise<string[][]> => {
    if (data.length === 0) return data;

    const [header, ...rows] = data;
    const dosageQtyUnitIndex = header.findIndex(
      (col) => col === "DOSAGE_QTY_UNIT"
    );
    const dosageIntervalUnitIndex = header.findIndex(
      (col) => col === "DOSAGE_INTERVAL_UNIT"
    );
    const dosageAdministrationUnitIndex = header.findIndex(
      (col) => col === "DOSAGE_ADMINISTRATION PERIOD_UNIT"
    );
    const drugFormulationEngIndex = header.findIndex(
      (col) => col === "DRUG_FORMULATION_ENG"
    );
    const dosageRouteEngIndex = header.findIndex(
      (col) => col === "DOSAGE_ROUTE_ENG"
    );
    if (
      dosageQtyUnitIndex === -1 &&
      dosageIntervalUnitIndex === -1 &&
      dosageAdministrationUnitIndex === -1 &&
      drugFormulationEngIndex === -1 &&
      dosageRouteEngIndex === -1
    ) {
      return data;
    }

    const dosageUnitMap = await loadDosageUnitMap();
    const edqmDrugShapeMap = await loadEdqmDrugShapeMap();
    const edqmDosageRouteMap = await loadEdqmDosageRouteMap();
    const transformedRows = rows.map((row) => {
      const newRow = [...row];
      if (dosageQtyUnitIndex < row.length) {
        const rawValue = row[dosageQtyUnitIndex]?.toString().trim();
        if (rawValue) {
          newRow[dosageQtyUnitIndex] = dosageUnitMap.get(rawValue) ?? rawValue;
        }
      }
      if (
        dosageIntervalUnitIndex !== -1 &&
        dosageIntervalUnitIndex < row.length
      ) {
        const rawValue = row[dosageIntervalUnitIndex]?.toString().trim();
        if (rawValue) {
          newRow[dosageIntervalUnitIndex] =
            dosageUnitMap.get(rawValue) ?? rawValue;
        }
      }
      if (
        dosageAdministrationUnitIndex !== -1 &&
        dosageAdministrationUnitIndex < row.length
      ) {
        const rawValue = row[dosageAdministrationUnitIndex]?.toString().trim();
        if (rawValue) {
          newRow[dosageAdministrationUnitIndex] =
            dosageUnitMap.get(rawValue) ?? rawValue;
        }
      }
      if (
        drugFormulationEngIndex !== -1 &&
        drugFormulationEngIndex < row.length
      ) {
        const rawValue = row[drugFormulationEngIndex]?.toString().trim();
        if (rawValue) {
          newRow[drugFormulationEngIndex] =
            edqmDrugShapeMap.get(rawValue) ?? rawValue;
        }
      }
      if (dosageRouteEngIndex !== -1 && dosageRouteEngIndex < row.length) {
        const rawValue = row[dosageRouteEngIndex]?.toString().trim();
        if (rawValue) {
          newRow[dosageRouteEngIndex] =
            edqmDosageRouteMap.get(rawValue) ?? rawValue;
        }
      }
      return newRow;
    });

    return [header, ...transformedRows];
  };

  // DRUG3 시트 전용 변환: PURPOSE OF ADMINISTRATION 값 VLOOKUP 치환
  const transformDrug3Sheet = async (data: string[][]): Promise<string[][]> => {
    if (data.length === 0) return data;
    if (!kcdVersion) return data;

    const [header, ...rows] = data;
    const purposeIndex = header.findIndex(
      (col) => col === "PURPOSE OF ADMINISTRATION"
    );
    if (purposeIndex === -1) return data;

    const kcdMap = await loadKcdMap(kcdVersion);
    const transformedRows = rows.map((row) => {
      const newRow = [...row];
      if (purposeIndex < row.length) {
        const rawValue = row[purposeIndex]?.toString().trim();
        if (rawValue) {
          newRow[purposeIndex] = kcdMap.get(rawValue) ?? rawValue;
        }
      }
      return newRow;
    });

    return [header, ...transformedRows];
  };

  // DRUG_EVENT 시트 전용 변환: 헤더 이름 변경 + RECHALLENGE_ADR_REOCCUR 값 매핑
  const transformDrugEventSheet = (data: string[][]): string[][] => {
    if (data.length === 0) return data;

    const [header, ...rows] = data;
    const renamedHeader = header.map(
      (col) => DRUG_EVENT_HEADER_RENAMES[col] ?? col
    );
    const rechallengeIndex = renamedHeader.findIndex(
      (col) => col === "RECHALLENGE_ADR_REOCCUR"
    );

    const transformedRows = rows.map((row) => {
      const newRow = [...row];
      if (rechallengeIndex !== -1 && rechallengeIndex < row.length) {
        const rawValue = row[rechallengeIndex];
        newRow[rechallengeIndex] =
          RECHALLENGE_ADR_REOCCUR_MAP[rawValue] ?? rawValue;
      }
      return newRow;
    });

    return [renamedHeader, ...transformedRows];
  };

  // ASSESSMENT 시트 전용 변환: 헤더 이름 변경 + CAUSALITY_ASSESSMENT 값 매핑
  const transformAssessmentSheet = (data: string[][]): string[][] => {
    if (data.length === 0) return data;

    const [header, ...rows] = data;
    const renamedHeader = header.map(
      (col) => ASSESSMENT_HEADER_RENAMES[col] ?? col
    );
    const causalityIndex = renamedHeader.findIndex(
      (col) => col === "CAUSALITY_ASSESSMENT"
    );

    const transformedRows = rows.map((row) => {
      const newRow = [...row];
      if (causalityIndex !== -1 && causalityIndex < row.length) {
        const rawValue = row[causalityIndex];
        newRow[causalityIndex] = CAUSALITY_ASSESSMENT_MAP[rawValue] ?? rawValue;
      }
      return newRow;
    });

    return [renamedHeader, ...transformedRows];
  };

  return (
    <div className={cls("text-[#24226A]")}>
      {/* 파일 업로드 영역 */}
      <div
        className={cls(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          dragActive
            ? "border-[#24226A] bg-[#24226A]/10"
            : "border-[#24226A]/30 hover:border-[#24226A]"
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
            className="mx-auto h-12 w-12 text-[#24226A]/40"
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
        <p className="text-[#24226A]/70 mb-1">
          <span className="font-semibold text-[#24226A]">
            클릭하여 파일 선택
          </span>{" "}
          또는 드래그 앤 드롭
        </p>
      </div>

      {/* 처리 중 표시 */}
      {isProcessing && (
        <div className="mt-4 text-center text-[#24226A]/70">
          <span className="inline-block animate-spin mr-2">⏳</span>
          파일 처리 중...
        </div>
      )}

      {/* 업로드된 파일 목록 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold">
              업로드된 파일 {uploadedFiles.length}개
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-[4px] bg-[#24226A]/10 px-3 py-1.5">
                <span className="text-xs font-semibold text-[#24226A]">
                  KCD 선택
                </span>
                <label className="flex items-center gap-1 text-xs text-[#24226A]">
                  <input
                    type="radio"
                    name="kcdVersion"
                    value="7"
                    checked={kcdVersion === "7"}
                    onChange={() => setKcdVersion("7")}
                    className="h-3.5 w-3.5 accent-[#24226A] focus:outline-none focus:ring-0"
                  />
                  7차
                </label>
                <label className="flex items-center gap-1 text-xs text-[#24226A]">
                  <input
                    type="radio"
                    name="kcdVersion"
                    value="8"
                    checked={kcdVersion === "8"}
                    onChange={() => setKcdVersion("8")}
                    className="h-3.5 w-3.5 accent-[#24226A] focus:outline-none focus:ring-0"
                  />
                  8차
                </label>
              </div>
              <button
                onClick={clearAll}
                className="px-3 py-1.5 text-sm text-[#24226A] bg-white border border-[#24226A]/20 rounded-[4px] hover:bg-[#24226A]/10"
              >
                전체 삭제
              </button>
              <button
                onClick={downloadExcel}
                className="px-4 py-1.5 text-sm text-white bg-[#24226A] rounded-[4px] hover:bg-[#1e1c57]"
              >
                엑셀 다운로드
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#24226A]/10 rounded-[6px] border border-[#24226A]/10 bg-white">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#24226A]/60">●</span>
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-[#24226A]/50">
                    {file.data.length}×{file.data[0]?.length || 0}
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-xs text-[#24226A]/40 hover:text-[#24226A]"
                  title="삭제"
                >
                  삭제
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
      subtitle: "",
    },
  };
};
