import { GetServerSideProps } from 'next';
import { cls } from '@/libs/client/utils';
import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';

type AdminDashboardProps = {
    title?: string;
    subtitle?: string;
};

interface UploadedFile {
    name: string;
    data: string[][];
}

export default function AdminDashboard({ title, subtitle }: AdminDashboardProps) {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 파이프 구분자로 파싱
    const parseAsciiFile = (content: string): string[][] => {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        return lines.map(line => line.split('|').map(cell => cell.trim()));
    };

    // 파일명에서 확장자 제거 (탭 이름용)
    const getFileNameWithoutExtension = (fileName: string): string => {
        const lastDotIndex = fileName.lastIndexOf('.');
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
                newFiles.push({
                    name: getFileNameWithoutExtension(file.name),
                    data
                });
            } catch (error) {
                console.error(`파일 처리 오류: ${file.name}`, error);
            }
        }

        setUploadedFiles(prev => [...prev, ...newFiles]);
        setIsProcessing(false);
    }, []);

    // 파일 선택 핸들러
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
        // input 초기화 (같은 파일 다시 선택 가능하게)
        e.target.value = '';
    };

    // 드래그 앤 드롭 핸들러
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
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

        uploadedFiles.forEach((file) => {
            // 시트 이름 길이 제한 (엑셀 31자 제한)
            let sheetName = file.name.substring(0, 31);
            // 중복 시트명 처리
            let counter = 1;
            let originalName = sheetName;
            while (workbook.SheetNames.includes(sheetName)) {
                const suffix = `_${counter}`;
                sheetName = originalName.substring(0, 31 - suffix.length) + suffix;
                counter++;
            }

            const worksheet = XLSX.utils.aoa_to_sheet(file.data);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });

        // 다운로드
        XLSX.writeFile(workbook, '통합_데이터.xlsx');
    };

    // 파일 삭제
    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // 전체 초기화
    const clearAll = () => {
        setUploadedFiles([]);
    };

    return (
        <div className={cls('text-gray-900')}>
            {/* 파일 업로드 영역 */}
            <div
                className={cls(
                    'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                    dragActive ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-gray-400'
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
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <p className="text-gray-600 mb-1">
                    <span className="font-semibold text-black">클릭하여 파일 선택</span> 또는 드래그 앤 드롭
                </p>
                <p className="text-sm text-gray-500">파이프(|) 구분자 형식의 텍스트 파일 (.txt, .csv, .dat)</p>
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

export const getServerSideProps: GetServerSideProps<AdminDashboardProps> = async () => {
    return {
        props: {
            title: '파일 변환',
            subtitle: '파이프(|) 구분자 파일을 엑셀로 변환합니다.'
        }
    };
};
