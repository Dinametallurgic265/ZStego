import { listen } from '@tauri-apps/api/event';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useEffect, useRef, useState, RefObject } from 'react';

interface DragDropPayload {
  paths: string[];
  position: { x: number; y: number };
}

interface DragOverPayload {
  position: { x: number; y: number };
}

function inBounds(el: HTMLElement, x: number, y: number): boolean {
  const r = el.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}


export function useTauriDrop(
  ref: RefObject<HTMLElement | null>,
  onPaths: (paths: string[]) => void,
) {
  const [isOver, setIsOver] = useState(false);
  const onPathsRef = useRef(onPaths);
  onPathsRef.current = onPaths;

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    const setup = async () => {
      unsubs.push(
        await listen<DragDropPayload>('tauri://drag-drop', (e) => {
          if (ref.current && inBounds(ref.current, e.payload.position.x, e.payload.position.y)) {
            onPathsRef.current(e.payload.paths);
          }
          setIsOver(false);
        }),
        await listen<DragOverPayload>('tauri://drag-over', (e) => {
          setIsOver(!!ref.current && inBounds(ref.current, e.payload.position.x, e.payload.position.y));
        }),
        await listen('tauri://drag-leave', () => setIsOver(false)),
        await listen('tauri://drag-cancel', () => setIsOver(false)),
      );
    };

    setup();
    return () => unsubs.forEach((fn) => fn());
  }, [ref]);

  return { isOver };
}

const CARRIER_EXTS = ['png', 'bmp', 'jpg', 'jpeg', 'wav', 'flac', 'mp3'];


export async function pickCarrier(): Promise<string | null> {
  const result = await openDialog({
    multiple: false,
    filters: [
      { name: 'Images', extensions: ['png', 'bmp', 'jpg', 'jpeg'] },
      { name: 'Audio', extensions: ['wav', 'flac', 'mp3'] },
      { name: 'All Supported', extensions: CARRIER_EXTS },
    ],
  });
  return typeof result === 'string' ? result : null;
}


export async function pickPayload(): Promise<string | null> {
  const result = await openDialog({ multiple: false });
  return typeof result === 'string' ? result : null;
}
