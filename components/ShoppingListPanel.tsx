"use client";

import { useState, useEffect, useRef } from "react";

interface ListItem {
  id: string;
  text: string;
  checked: boolean;
}

function loadItems(): ListItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("shopping-list");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: ListItem[]) {
  localStorage.setItem("shopping-list", JSON.stringify(items));
}

export function ShoppingListPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ListItem[]>([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  // ids currently playing exit animation before moving section
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  // ids that just entered a new section (entrance animation)
  const [entered, setEntered] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setItems(loadItems());
  }, []);

  // Persist on change
  useEffect(() => {
    saveItems(items);
  }, [items]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  // Focus main input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  function addItem() {
    const text = input.trim();
    if (!text) return;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, checked: false },
    ]);
    setInput("");
    inputRef.current?.focus();
  }

  function toggleItem(id: string) {
    // Play exit animation first, then do the actual state change
    setLeaving((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );
      setLeaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      // Mark as entered so entrance animation plays
      setEntered((prev) => new Set(prev).add(id));
      setTimeout(() => {
        setEntered((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 300);
    }, 220);
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function startEdit(item: ListItem) {
    setEditingId(item.id);
    setEditingText(item.text);
  }

  function commitEdit(id: string) {
    const text = editingText.trim();
    if (text) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, text } : item))
      );
    }
    setEditingId(null);
  }

  function clearAll() {
    setItems([]);
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const total = items.length;

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg px-4 py-3 transition-all"
        aria-label="Lista del super"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <span className="text-sm font-medium">Lista</span>
        {total > 0 && (
          <span className="bg-white text-blue-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl
          flex flex-col transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Lista del super</h2>
            {total > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {checked.length}/{total} agarrados
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {total > 0 && (
              <button
                onClick={clearAll}
                className="text-xm text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors bg-red-50 "
              >
                Borrar todo
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Add input */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addItem();
              }}
              placeholder="Agregar producto..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
            <button
              onClick={addItem}
              disabled={!input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-lg px-3 py-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {items.length === 0 ? (
            <div className="text-center py-16 text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">Tu lista está vacía</p>
              <p className="text-xs mt-1">Escribí un producto arriba para agregar</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Unchecked items */}
              {unchecked.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isLeaving={leaving.has(item.id)}
                  isEntering={entered.has(item.id)}
                  enterDirection="bottom"
                  isEditing={editingId === item.id}
                  editingText={editingText}
                  editRef={editRef}
                  onToggle={() => toggleItem(item.id)}
                  onDelete={() => deleteItem(item.id)}
                  onStartEdit={() => startEdit(item)}
                  onEditChange={(v) => setEditingText(v)}
                  onEditCommit={() => commitEdit(item.id)}
                  onEditCancel={() => setEditingId(null)}
                />
              ))}

              {/* Divider if both sections exist */}
              {unchecked.length > 0 && checked.length > 0 && (
                <div className="flex items-center gap-2 py-2">
                  <div className="flex-1 border-t border-gray-100" />
                  <span className="text-xs text-gray-300">ya agarrado</span>
                  <div className="flex-1 border-t border-gray-100" />
                </div>
              )}

              {/* Checked items */}
              {checked.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isLeaving={leaving.has(item.id)}
                  isEntering={entered.has(item.id)}
                  enterDirection="top"
                  isEditing={editingId === item.id}
                  editingText={editingText}
                  editRef={editRef}
                  onToggle={() => toggleItem(item.id)}
                  onDelete={() => deleteItem(item.id)}
                  onStartEdit={() => startEdit(item)}
                  onEditChange={(v) => setEditingText(v)}
                  onEditCommit={() => commitEdit(item.id)}
                  onEditCancel={() => setEditingId(null)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface ItemRowProps {
  item: ListItem;
  isLeaving: boolean;
  isEntering: boolean;
  enterDirection: "top" | "bottom";
  isEditing: boolean;
  editingText: string;
  editRef: React.RefObject<HTMLInputElement | null>;
  onToggle: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onEditChange: (v: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
}

function ItemRow({
  item,
  isLeaving,
  isEntering,
  enterDirection,
  isEditing,
  editingText,
  editRef,
  onToggle,
  onDelete,
  onStartEdit,
  onEditChange,
  onEditCommit,
  onEditCancel,
}: ItemRowProps) {
  const enterClass = isEntering
    ? enterDirection === "top"
      ? "animate-list-in"
      : "animate-list-in-bottom"
    : "";

  return (
    <div
      className={`flex items-center gap-2 px-2 py-2 rounded-lg group transition-all duration-200 ${enterClass} ${
        isLeaving
          ? "opacity-0 scale-95 -translate-x-2"
          : item.checked
          ? "opacity-50"
          : "hover:bg-gray-50"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.checked
            ? "bg-green-500 border-green-500"
            : "border-gray-300 hover:border-green-400"
        }`}
      >
        {item.checked && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Text / Edit input */}
      {isEditing ? (
        <input
          ref={editRef}
          type="text"
          value={editingText}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEditCommit();
            if (e.key === "Escape") onEditCancel();
          }}
          onBlur={onEditCommit}
          className="flex-1 border border-blue-300 rounded px-2 py-0.5 text-sm outline-none focus:ring-1 focus:ring-blue-200"
        />
      ) : (
        <span
          onClick={onStartEdit}
          className={`flex-1 text-sm cursor-text select-none ${
            item.checked ? "line-through text-gray-400" : "text-gray-700"
          }`}
        >
          {item.text}
        </span>
      )}

      {/* Delete */}
      {!isEditing && (
        <button
          onClick={onDelete}
          className="flex-shrink-0 p-1 text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
