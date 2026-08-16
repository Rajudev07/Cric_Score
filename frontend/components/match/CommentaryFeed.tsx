"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MicOff } from "lucide-react";
import type { CommentaryItem } from "@/lib/data/matches";
import CommentaryCard from "@/components/matches/CommentaryCard";
import TabEmptyState from "@/components/match/TabEmptyState";
import { Button } from "@/components/ui/button";

const PAGE = 20;

export default function CommentaryFeed({ items }: { items: CommentaryItem[] }) {
  const [visible, setVisible] = useState(PAGE);
  const prevLen = useRef(items.length);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const ordered = useMemo(() => [...items].reverse(), [items]);

  useEffect(() => {
    if (items.length > prevLen.current) {
      const added = new Set<string>();
      for (let i = 0; i < items.length - prevLen.current; i++) {
        const c = items[items.length - 1 - i];
        if (c) added.add(`${c.over}|${c.text.slice(0, 40)}`);
      }
      setNewIds(added);
      const t = setTimeout(() => setNewIds(new Set()), 800);
      prevLen.current = items.length;
      return () => clearTimeout(t);
    }
    prevLen.current = items.length;
  }, [items]);

  const shown = ordered.slice(0, visible);

  if (!items.length) {
    return (
      <TabEmptyState
        icon={MicOff}
        text="Commentary not available"
        subtext="Check back during active play"
      />
    );
  }

  return (
    <div className="space-y-3">
      {shown.map((item, index) => {
        const key = `${item.over}-${index}`;
        const id = `${item.over}|${item.text.slice(0, 40)}`;
        const isNew = newIds.has(id);
        return (
          <div
            key={key}
            className={isNew ? "animate-[slideDown_0.25s_ease-out]" : undefined}
          >
            <CommentaryCard item={item} />
          </div>
        );
      })}
      {visible < ordered.length ? (
        <Button
          type="button"
          variant="outline"
          className="w-full border-zinc-700"
          onClick={() => setVisible((v) => v + PAGE)}
        >
          Load more ({ordered.length - visible} remaining)
        </Button>
      ) : null}
    </div>
  );
}
