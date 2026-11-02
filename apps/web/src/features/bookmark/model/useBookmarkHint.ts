'use client';

import { useEffect, useState } from 'react';
import type { BookmarkKind } from '../api/bookmarkApi';
import { useBookmarkAccess, useMyBookmarkIds } from './useMyBookmarkIds';

/**
 * 상세 화면의 북마크 안내 문구. 지금 되는 기능만 말한다. 스크랩 마감 알림톡은 템플릿 승인을 기다리며
 * 꺼져 있고(`ogonggo-BE/docs/architecture/scheduling.md` 의 `jobBookmarkAlimTalkReminder`), 달력은
 * 채용공고만 있어 달력 문구는 공고에만 둔다.
 */
const HINT_MESSAGES: Record<BookmarkKind, readonly string[]> = {
  jobs: [
    '마음에 든다면 저장해 두세요',
    '저장하면 달력에서 모아볼 수 있어요',
    '저장한 공고는 마이페이지에 모여요',
  ],
  bootcamps: [
    '마음에 든다면 저장해 두세요',
    '나중에 다시 보고 싶다면 북마크',
    '저장한 교육은 마이페이지에 모여요',
  ],
  'side-studies': [
    '마음에 든다면 저장해 두세요',
    '나중에 다시 보고 싶다면 북마크',
    '저장한 글은 마이페이지에 모여요',
  ],
};

/** 한 문구가 보이는 시간. 의견 보내기 말풍선과 같다. */
const HINT_HOLD_MS = 6000;
/** 사라졌다 나타나는 전환 시간. `HINT_FADE_CLASS` 의 `duration-900` 과 맞춘다. */
const HINT_FADE_MS = 900;

export const HINT_FADE_CLASS = 'block motion-safe:transition motion-safe:duration-900';
export const HINT_SHOWN_CLASS = 'translate-y-0 opacity-100';
export const HINT_HIDDEN_CLASS = 'opacity-0 motion-safe:translate-y-1';

export interface BookmarkHintTarget {
  kind: BookmarkKind;
  id: number;
  /** 서버가 준 `bookmarked`. id 모음이 도착하면 그쪽이 이긴다. */
  bookmarked: boolean;
}

/**
 * 안내를 보일지. 아직 저장하지 않은 일반 회원과 비로그인 사용자에게만 보인다. 비로그인은 눌렀을 때
 * 로그인 화면으로 간다. 일반 회원은 내 목록이 도착한 뒤에 정한다 — 저장한 공고에 안내가 잠깐 비치면 안
 * 된다. 고정 바의 띠와 데스크톱 말풍선이 함께 쓰고, 누르는 순간 id 모음이 바뀌어 바로 사라진다.
 */
export function useBookmarkHintVisible({ kind, id, bookmarked }: BookmarkHintTarget): boolean {
  const access = useBookmarkAccess();
  const ids = useMyBookmarkIds(kind);
  if (access === 'guest') {
    return !bookmarked;
  }
  return access === 'member' && ids !== undefined && !ids.has(id);
}

/** 지금 보일 문구와 전환 상태. 문구는 천천히 사라졌다가 다음 문구로 바뀌어 나타난다. */
export function useRotatingBookmarkHint(kind: BookmarkKind) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const messages = HINT_MESSAGES[kind];

  useEffect(() => {
    let fade: number | undefined;
    const hold = window.setInterval(() => {
      setVisible(false);
      fade = window.setTimeout(() => {
        setIndex((current) => current + 1);
        setVisible(true);
      }, HINT_FADE_MS);
    }, HINT_HOLD_MS + HINT_FADE_MS);
    return () => {
      window.clearInterval(hold);
      window.clearTimeout(fade);
    };
  }, []);

  return { message: messages[index % messages.length], visible };
}
