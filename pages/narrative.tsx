import { GetServerSideProps } from "next";
import { cls } from "@/libs/client/utils";
import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx-js-style";

type NarrativePageProps = {
  title?: string;
  subtitle?: string;
};

interface KaersData {
  kaersNo: string;
  initialFu: string;        // GROUP 시트의 INITIAL_FU
  drugCode: string;         // DRUG 시트의 DRUG_CODE
  patientSex: string;       // DEMO 시트의 PATIENT SEX
  patientBirthYear: string; // DEMO 시트의 PATIENT BIRTH YEAR
  adrStartDate: string;     // EVENT 시트의 ADR_START_DATE
  adrMeddraEngList: string[]; // EVENT 시트의 ADR_MEDDRA_ENG (여러 개)
  causalityAssessmentList: string[]; // ASSESSMENT 시트의 CAUSALITY_ASSESSMENT (여러 개)
}

interface UploadedFile {
  name: string;
  kaersDataList: KaersData[];
}

const NARRATIVE_HEADERS = [
  "KAERS_NO",
  "KAERS GROUP No",
  "Local Ref. No.",
  "Mfr.Control no.",
  "Type (Initial/FU)",
  "Suspected Drug",
  "Patient Gender",
  "Patient DOB",
  "Event",
  "Event(GS)",
  "Seriousness\nYes/No",
  "Related\nYes/No",
  "Event causality as determined (GS)",
  "Onset date",
  "Day 0\n(Download date)",
  "Due date of reporting to GS",
  "Date of reporting to central GS",
  "late reporting to GS?",
  "Product complaints issue\nYes/No",
  "Narrative",
];

const HEADER_FILL_COLOR = "71AD47";

export default function NarrativePage({
  title,
  subtitle,
}: NarrativePageProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일명에서 확장자 제거
  const getFileNameWithoutExtension = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) return fileName;
    return fileName.substring(0, lastDotIndex);
  };

  // 시트 데이터를 Map으로 변환하는 헬퍼 함수
  const parseSheetToMap = (
    workbook: XLSX.WorkBook,
    sheetName: string,
    keyColumn: string,
    valueColumns: string[]
  ): Map<string, Record<string, string>> => {
    const map = new Map<string, Record<string, string>>();
    const sheet = workbook.SheetNames.find(
      (name) => name.toUpperCase() === sheetName.toUpperCase()
    );
    if (!sheet) return map;

    const worksheet = workbook.Sheets[sheet];
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
    }) as string[][];

    if (data.length === 0) return map;

    const [header, ...rows] = data;
    const keyIndex = header.findIndex(
      (col) => col?.toString().toUpperCase() === keyColumn.toUpperCase()
    );
    if (keyIndex === -1) return map;

    const valueIndices = valueColumns.map((col) =>
      header.findIndex(
        (h) => h?.toString().toUpperCase() === col.toUpperCase()
      )
    );

    rows.forEach((row) => {
      const key = row[keyIndex]?.toString().trim();
      if (!key) return;

      const values: Record<string, string> = {};
      valueColumns.forEach((col, i) => {
        const idx = valueIndices[i];
        values[col] = idx !== -1 ? (row[idx]?.toString().trim() ?? "") : "";
      });

      // 기존 값이 없거나 비어있을 때만 저장 (첫 번째 값 유지)
      if (!map.has(key)) {
        map.set(key, values);
      }
    });

    return map;
  };

  // 파일 처리 - 엑셀 파일에서 여러 시트의 데이터 추출
  const processFiles = useCallback(async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        // GROUP 시트에서 KAERS_NO, INITIAL_FU 추출
        const groupMap = parseSheetToMap(workbook, "GROUP", "KAERS_NO", ["INITIAL_FU"]);

        if (groupMap.size === 0) {
          console.error(`GROUP 시트를 찾을 수 없거나 비어있습니다: ${file.name}`);
          continue;
        }

        // DRUG 시트에서 DRUG_CODE, DRUG_SEQ 추출 (DRUG_GROUP이 "Suspect"인 것만)
        const drugMap = new Map<string, string>();
        const drugSeqMap = new Map<string, string[]>(); // KAERS_NO별 DRUG_SEQ 목록
        const drugSheet = workbook.SheetNames.find(
          (name) => name.toUpperCase() === "DRUG"
        );
        if (drugSheet) {
          const worksheet = workbook.Sheets[drugSheet];
          const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            blankrows: false,
          }) as string[][];

          if (data.length > 0) {
            const [header, ...rows] = data;
            const kaersNoIdx = header.findIndex(
              (col) => col?.toString().toUpperCase() === "KAERS_NO"
            );
            const drugCodeIdx = header.findIndex(
              (col) => col?.toString().toUpperCase() === "DRUG_CODE"
            );
            const drugGroupIdx = header.findIndex(
              (col) => col?.toString().toUpperCase() === "DRUG_GROUP"
            );
            const drugSeqIdx = header.findIndex(
              (col) => col?.toString().toUpperCase() === "DRUG_SEQ"
            );

            if (kaersNoIdx !== -1 && drugCodeIdx !== -1) {
              rows.forEach((row) => {
                const kaersNo = row[kaersNoIdx]?.toString().trim();
                const drugCode = row[drugCodeIdx]?.toString().trim();
                const drugGroup = drugGroupIdx !== -1 ? row[drugGroupIdx]?.toString().trim() : "";
                const drugSeq = drugSeqIdx !== -1 ? row[drugSeqIdx]?.toString().trim() : "";

                // DRUG_CODE가 있는 행의 DRUG_SEQ 저장
                if (kaersNo && drugCode && drugSeq) {
                  if (!drugSeqMap.has(kaersNo)) {
                    drugSeqMap.set(kaersNo, []);
                  }
                  drugSeqMap.get(kaersNo)!.push(drugSeq);
                }

                // DRUG_GROUP이 "Suspect"인 것만 저장, 첫 번째 값 유지
                if (kaersNo && drugCode && drugGroup === "Suspect" && !drugMap.has(kaersNo)) {
                  drugMap.set(kaersNo, drugCode);
                }
              });
            }
          }
        }

        // ASSESSMENT 시트에서 CAUSALITY_ASSESSMENT 추출
        const assessmentMap = new Map<string, Map<string, string[]>>(); // KAERS_NO -> DRUG_SEQ -> CAUSALITY_ASSESSMENT[]
        const assessmentSheet = workbook.SheetNames.find(
          (name) => name.toUpperCase() === "ASSESSMENT"
        );
        if (assessmentSheet) {
          const worksheet = workbook.Sheets[assessmentSheet];
          const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            blankrows: false,
          }) as string[][];

          if (data.length > 0) {
            const [header, ...rows] = data;
            const kaersNoIdx = header.findIndex(
              (col) => col?.toString().toUpperCase() === "KAERS_NO"
            );
            const drugSeqIdx = header.findIndex(
              (col) => col?.toString().toUpperCase() === "DRUG_SEQ"
            );
            const causalityIdx = header.findIndex(
              (col) => col?.toString().toUpperCase() === "CAUSALITY_ASSESSMENT"
            );

            if (kaersNoIdx !== -1 && drugSeqIdx !== -1 && causalityIdx !== -1) {
              rows.forEach((row) => {
                const kaersNo = row[kaersNoIdx]?.toString().trim();
                const drugSeq = row[drugSeqIdx]?.toString().trim();
                const causality = row[causalityIdx]?.toString().trim();

                if (kaersNo && drugSeq && causality) {
                  if (!assessmentMap.has(kaersNo)) {
                    assessmentMap.set(kaersNo, new Map());
                  }
                  const seqMap = assessmentMap.get(kaersNo)!;
                  if (!seqMap.has(drugSeq)) {
                    seqMap.set(drugSeq, []);
                  }
                  seqMap.get(drugSeq)!.push(causality);
                }
              });
            }
          }
        }

        // DEMO 시트에서 PATIENT SEX, PATIENT BIRTH YEAR 추출
        const demoMap = parseSheetToMap(workbook, "DEMO", "KAERS_NO", [
          "PATIENT SEX",
          "PATIENT BIRTH YEAR",
        ]);

        // EVENT 시트에서 ADR_START_DATE, ADR_MEDDRA_ENG 추출
        const eventMap = parseSheetToMap(workbook, "EVENT", "KAERS_NO", ["ADR_START_DATE"]);

        // EVENT 시트에서 ADR_MEDDRA_ENG 여러 개 추출 (동일 KAERS_NO의 모든 값)
        const eventMeddraMap = new Map<string, string[]>();
        const eventSheet = workbook.SheetNames.find(
          (name) => name.toUpperCase() === "EVENT"
        );
        if (eventSheet) {
          const worksheet = workbook.Sheets[eventSheet];
          const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            blankrows: false,
          }) as string[][];

          if (data.length > 0) {
            const [header, ...rows] = data;
            const kaersNoIdx = header.findIndex(
              (col) => col?.toString().toUpperCase() === "KAERS_NO"
            );
            const adrMeddraEngIdx = header.findIndex(
              (col) => col?.toString().toUpperCase() === "ADR_MEDDRA_ENG"
            );

            if (kaersNoIdx !== -1 && adrMeddraEngIdx !== -1) {
              rows.forEach((row) => {
                const kaersNo = row[kaersNoIdx]?.toString().trim();
                const adrMeddraEng = row[adrMeddraEngIdx]?.toString().trim();

                if (kaersNo && adrMeddraEng) {
                  if (!eventMeddraMap.has(kaersNo)) {
                    eventMeddraMap.set(kaersNo, []);
                  }
                  eventMeddraMap.get(kaersNo)!.push(adrMeddraEng);
                }
              });
            }
          }
        }

        // GROUP 시트의 KAERS_NO 기준으로 데이터 조합
        const kaersDataList: KaersData[] = [];
        groupMap.forEach((groupData, kaersNo) => {
          const demoData = demoMap.get(kaersNo) ?? {};
          const eventData = eventMap.get(kaersNo) ?? {};

          // DRUG_CODE가 있는 DRUG_SEQ들의 CAUSALITY_ASSESSMENT 수집
          const causalityList: string[] = [];
          const drugSeqs = drugSeqMap.get(kaersNo) ?? [];
          const seqAssessmentMap = assessmentMap.get(kaersNo);
          if (seqAssessmentMap) {
            drugSeqs.forEach((seq) => {
              const assessments = seqAssessmentMap.get(seq) ?? [];
              causalityList.push(...assessments);
            });
          }

          kaersDataList.push({
            kaersNo,
            initialFu: groupData["INITIAL_FU"] ?? "",
            drugCode: drugMap.get(kaersNo) ?? "",
            patientSex: demoData["PATIENT SEX"] ?? "",
            patientBirthYear: demoData["PATIENT BIRTH YEAR"] ?? "",
            adrStartDate: eventData["ADR_START_DATE"] ?? "",
            adrMeddraEngList: eventMeddraMap.get(kaersNo) ?? [],
            causalityAssessmentList: causalityList,
          });
        });

        const nameWithoutExt = getFileNameWithoutExtension(file.name);

        newFiles.push({
          name: nameWithoutExt,
          kaersDataList: kaersDataList,
        });
      } catch (error) {
        console.error(`파일 처리 오류: ${file.name}`, error);
      }
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setIsProcessing(false);
  }, []);

  // 헤더 스타일 적용
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
        alignment: {
          wrapText: true,
          vertical: "center",
          horizontal: "center",
        },
      };
    }
  };

  // 열 너비 자동 계산
  const calcAutoCols = (
    rows: Array<Array<string | number | null | undefined>>
  ): XLSX.ColInfo[] => {
    const maxLens: number[] = [];

    const getDisplayWidth = (str: string): number => {
      let width = 0;
      for (const char of str) {
        if (/[\u1100-\u11FF\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/.test(char)) {
          width += 2;
        } else {
          width += 1;
        }
      }
      return width;
    };

    rows.forEach((row) => {
      row.forEach((cell, i) => {
        const cellStr = String(cell ?? "");
        // 줄바꿈이 있는 경우 각 줄 중 가장 긴 것으로 계산
        const lines = cellStr.split("\n");
        const maxLineWidth = Math.max(...lines.map((line) => getDisplayWidth(line)));
        maxLens[i] = Math.max(maxLens[i] ?? 0, maxLineWidth);
      });
    });

    return maxLens.map((len) => ({ wch: Math.min(len + 2, 50) }));
  };

  // 엑셀 다운로드
  const downloadExcel = () => {
    if (uploadedFiles.length === 0) return;

    // 모든 업로드된 파일의 데이터를 합침
    const allKaersData = uploadedFiles.flatMap((file) => file.kaersDataList);

    // 헤더 + 데이터 행 생성
    const sheetData: string[][] = [NARRATIVE_HEADERS];

    // 헤더 인덱스 매핑
    const COL_KAERS_NO = 0;           // KAERS_NO
    const COL_KAERS_GROUP_NO = 1;     // KAERS GROUP No (← INITIAL_FU)
    const COL_SUSPECTED_DRUG = 5;     // Suspected Drug (← DRUG_CODE)
    const COL_PATIENT_GENDER = 6;     // Patient Gender (← PATIENT SEX)
    const COL_PATIENT_DOB = 7;        // Patient DOB (← PATIENT BIRTH YEAR)
    const COL_EVENT = 8;              // Event (← ADR_MEDDRA_ENG, 여러 개 줄바꿈)
    const COL_RELATED = 11;           // Related Yes/No (← CAUSALITY_ASSESSMENT, 여러 개 줄바꿈)
    const COL_ONSET_DATE = 13;        // Onset date (← ADR_START_DATE)

    allKaersData.forEach((data) => {
      const row = new Array(NARRATIVE_HEADERS.length).fill("");
      row[COL_KAERS_NO] = data.kaersNo;
      row[COL_KAERS_GROUP_NO] = data.initialFu;
      row[COL_SUSPECTED_DRUG] = data.drugCode;
      row[COL_PATIENT_GENDER] = data.patientSex;
      row[COL_PATIENT_DOB] = data.patientBirthYear;
      row[COL_EVENT] = data.adrMeddraEngList.join("\n"); // 여러 값 줄바꿈으로 연결
      row[COL_RELATED] = data.causalityAssessmentList.join("\n"); // 여러 값 줄바꿈으로 연결
      row[COL_ONSET_DATE] = data.adrStartDate;
      sheetData.push(row);
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    worksheet["!cols"] = calcAutoCols(sheetData);
    applyHeaderStyle(worksheet);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Narrative");
    XLSX.writeFile(workbook, "Narrative_Template.xlsx");
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
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

  // 파일 삭제
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 전체 초기화
  const clearAll = () => {
    setUploadedFiles([]);
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
          accept=".xlsx,.xls"
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
                    KAERS_NO {file.kaersDataList.length}건
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
  NarrativePageProps
> = async () => {
  return {
    props: {
      title: "NARRATIVE",
      subtitle: "",
    },
  };
};
