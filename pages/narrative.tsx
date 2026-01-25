import { GetServerSideProps } from "next";
import { cls } from "@/libs/client/utils";
import { useState, useCallback, useRef } from "react";

type NarrativePageProps = {
  title?: string;
  subtitle?: string;
};

interface UploadedFile {
  name: string;
  content: string;
}

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

  // 파일 처리
  const processFiles = useCallback(async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      try {
        const content = await file.text();
        const nameWithoutExt = getFileNameWithoutExtension(file.name);

        newFiles.push({
          name: nameWithoutExt,
          content: content,
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
              <button
                onClick={clearAll}
                className="px-3 py-1.5 text-sm text-[#24226A] bg-white border border-[#24226A]/20 rounded-[4px] hover:bg-[#24226A]/10"
              >
                전체 삭제
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
