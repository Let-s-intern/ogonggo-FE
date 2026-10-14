import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ActionAlert, Button, Checkbox, Modal } from '@ogonggo/ui';
import {
  buildUtmLinks,
  groupByChannel,
  templateLabel,
  toClipboardText,
  toCsv,
  toHyperlinkHtml,
  toUrlText,
  UTM_TEMPLATES,
  type UtmContentKind,
  type UtmPosting,
  type UtmTemplate,
} from '../model/utmLinks';

export interface UtmLinksButtonProps {
  kind: UtmContentKind;
  /** 이 페이지에서 고른 행. */
  postings: UtmPosting[];
  /**
   * 검색 결과 전체를 고른 상태. 그때는 id 만 있고 제목이 없어 붙여넣기 문구를 만들 수 없다. 버튼을 끈다.
   */
  allMatching: boolean;
}

/** 목록 위 줄의 `UTM 링크` 버튼. 누르면 채널을 고르는 창이 열린다. */
export function UtmLinksButton({ kind, postings, allMatching }: UtmLinksButtonProps) {
  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState<{ message: string; nonce: number } | null>(null);

  return (
    <>
      {/* 버튼이 transform 이 걸린 하단 바 안에 있어 `fixed` 가 바 기준이 된다. body 로 빼 화면 가운데에 띄운다. */}
      {alert
        ? createPortal(
            <ActionAlert
              message={alert.message}
              nonce={alert.nonce}
              onDismiss={() => setAlert(null)}
            />,
            document.body,
          )
        : null}
      <Button
        size="sm"
        variant="secondary"
        disabled={allMatching || postings.length === 0}
        title={allMatching ? 'UTM 링크는 이 페이지에서 고른 행으로 만듭니다.' : undefined}
        onClick={() => setOpen(true)}
      >
        UTM 링크
      </Button>
      <Modal
        open={open}
        title="UTM 링크 만들기"
        description={`고른 ${postings.length}건에 붙일 채널을 고릅니다.`}
        onClose={() => setOpen(false)}
        className="w-[min(64rem,calc(100vw-2rem))]"
      >
        {open ? (
          <UtmLinksForm
            kind={kind}
            postings={postings}
            onClose={() => setOpen(false)}
            onDone={(message) => {
              setOpen(false);
              setAlert({ message, nonce: Date.now() });
            }}
          />
        ) : null}
      </Modal>
    </>
  );
}

const GROUPS = groupByChannel(UTM_TEMPLATES);

function UtmLinksForm({
  kind,
  postings,
  onClose,
  onDone,
}: {
  kind: UtmContentKind;
  postings: UtmPosting[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [picked, setPicked] = useState<Set<UtmTemplate>>(new Set());
  const [copyFailed, setCopyFailed] = useState(false);
  // 고른 순서가 아니라 파일 순서로 링크를 늘어놓는다.
  const links = buildUtmLinks(
    kind,
    postings,
    UTM_TEMPLATES.filter((template) => picked.has(template)),
  );

  const set = (templates: UtmTemplate[], checked: boolean) => {
    const next = new Set(picked);
    for (const template of templates) {
      if (checked) {
        next.add(template);
      } else {
        next.delete(template);
      }
    }
    setPicked(next);
  };

  const copy = async (write: () => Promise<void>, message: string) => {
    try {
      await write();
      onDone(message);
    } catch {
      setCopyFailed(true);
    }
  };

  const copyUrls = () =>
    copy(
      () => navigator.clipboard.writeText(toUrlText(links)),
      `${links.length}개 링크 주소만 복사했습니다.`,
    );

  // 서식을 받는 곳에는 HTML, 받지 않는 곳에는 기존 텍스트가 붙는다.
  const copyHyperlinks = () =>
    copy(
      () =>
        navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([toHyperlinkHtml(links)], { type: 'text/html' }),
            'text/plain': new Blob([toClipboardText(links)], { type: 'text/plain' }),
          }),
        ]),
      `${links.length}개 링크를 하이퍼링크로 복사했습니다.`,
    );

  const download = () => {
    const blob = new Blob([toCsv(kind, links)], { type: 'text/csv;charset=utf-8' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `utm-links-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
    onDone(`${links.length}개 링크를 CSV 로 내려받았습니다.`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
          <Checkbox
            className="border-b border-gray-200 pb-3"
            checked={picked.size === UTM_TEMPLATES.length}
            onChange={(checked) => set(UTM_TEMPLATES, checked)}
            label="전체 선택"
            labelClassName="font-bold"
          />
          {GROUPS.map((group) => (
            <fieldset key={group.channel} className="flex flex-col gap-2">
              <legend className="pb-1">
                <Checkbox
                  checked={group.items.every((template) => picked.has(template))}
                  onChange={(checked) => set(group.items, checked)}
                  label={group.channel}
                  labelClassName="font-bold"
                />
              </legend>
              {group.items.map((template) => (
                <Checkbox
                  key={template.medium}
                  className="pl-6"
                  checked={picked.has(template)}
                  onChange={(checked) => set([template], checked)}
                  label={template.placement}
                />
              ))}
            </fieldset>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-auto rounded-lg border border-gray-200">
          {links.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-400">
              채널을 고르면 링크가 보입니다.
            </p>
          ) : (
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                  <th scope="col" className="w-[30%] px-3 py-2 font-medium">
                    제목
                  </th>
                  <th scope="col" className="w-[25%] px-3 py-2 font-medium">
                    채널
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    URL
                  </th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.url} className="border-b border-gray-100 last:border-b-0 align-top">
                    <td className="px-3 py-2 text-gray-900">{link.posting.title}</td>
                    <td className="px-3 py-2 text-gray-500">{templateLabel(link.template)}</td>
                    <td className="break-all px-3 py-2 text-gray-500">{link.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {copyFailed ? (
          <span className="mr-auto text-sm text-red-500">
            복사하지 못했습니다. CSV 로 내려받아 주세요.
          </span>
        ) : null}
        <span className="text-sm text-gray-500">{links.length}개 링크</span>
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button variant="secondary" disabled={links.length === 0} onClick={download}>
          CSV 내보내기
        </Button>
        <Button variant="secondary" disabled={links.length === 0} onClick={copyUrls}>
          링크만 복사
        </Button>
        <Button disabled={links.length === 0} onClick={copyHyperlinks}>
          하이퍼링크로 복사
        </Button>
      </div>
    </div>
  );
}
