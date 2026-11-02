'use client';

import { type ChangeEvent, useEffect, useState } from 'react';
import { getImage } from '@/lib/client/imageStore';
import { UPLOAD_MIME } from '../EditorCanvas';
import { Drawer } from '../LeftRail';

/**
 * 업로드 서랍. 이 문서에 올린 이미지(시작 화면 첨부와 여기서 올린 것, `CardDocument.uploads`)를 이
 * 브라우저 IndexedDB 에서 읽어 보여 준다. 누르면 보고 있는 장 가운데에, 캔버스로 끌어 놓으면 놓은 자리에
 * 이미지 요소로 넣는다.
 */
export function UploadDrawer({
  uploads,
  onUpload,
  onAdd,
}: {
  /** 이미지 id(IndexedDB 열쇠). */
  uploads: string[];
  onUpload: (files: File[]) => void;
  onAdd: (src: string) => void;
}) {
  const [images, setImages] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let cancelled = false;
    const missing = uploads.filter((id) => !(id in images));
    if (missing.length === 0) {
      return;
    }
    void Promise.all(missing.map(async (id) => [id, await getImage(id)] as const)).then((found) => {
      if (!cancelled) {
        setImages((current) => ({ ...current, ...Object.fromEntries(found) }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [uploads, images]);

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])].filter((file) => file.type.startsWith('image/'));
    event.target.value = '';
    if (files.length > 0) {
      onUpload(files);
    }
  };

  return (
    <Drawer title="업로드">
      <label className="cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-600 hover:bg-gray-50">
        이미지 올리기
        <input type="file" accept="image/*" multiple className="hidden" onChange={pick} />
      </label>
      <p className="text-xs text-gray-500">
        누르면 이 장 가운데에, 캔버스로 끌어 놓으면 놓은 자리에 넣습니다. 올린 이미지는 이
        브라우저에만 남습니다.
      </p>
      {uploads.length === 0 ? (
        <p className="text-sm text-gray-500">올린 이미지가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {uploads.map((id) => {
            const src = images[id];
            return src ? (
              <button
                key={id}
                type="button"
                draggable
                aria-label="올린 이미지 넣기"
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'copy';
                  event.dataTransfer.setData(UPLOAD_MIME, id);
                }}
                onClick={() => onAdd(src)}
                className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200 hover:ring-blue-300"
              >
                <img src={src} alt="" className="size-full object-contain" />
              </button>
            ) : (
              <span
                key={id}
                className="flex aspect-square items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400"
              >
                {src === null ? '이 브라우저에 없음' : '읽는 중'}
              </span>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
