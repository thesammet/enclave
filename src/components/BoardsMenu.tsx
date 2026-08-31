import { useState } from 'react'
import { type SavedBoard, deleteBoard, listBoards, saveBoard } from '../store/boards'
import { useStore } from '../store/store'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Menu } from './ui/Menu'

export function BoardsMenu() {
  const cards = useStore((s) => s.cards)
  const globalFilter = useStore((s) => s.globalFilter)
  const loadBoard = useStore((s) => s.loadBoard)
  const [boards, setBoards] = useState<SavedBoard[]>(() => listBoards())
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function save() {
    try {
      saveBoard(name, cards, globalFilter)
      setBoards(listBoards())
      setName('')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <Menu label={`Boards${boards.length ? ` (${boards.length})` : ''}`}>
      {(close) => (
        <div className="space-y-2">
          <p className="px-1 text-[11px] leading-relaxed text-neutral-500">
            A board saves the analysis — cards and the filter — never a row of data. It re-runs
            against whichever dataset is loaded.
          </p>

          <div className="flex gap-1.5">
            <Input
              value={name}
              placeholder="Name this board"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
            <Button onClick={save} disabled={cards.length === 0}>
              Save
            </Button>
          </div>
          {error && <p className="px-1 text-[11px] text-red-500">{error}</p>}

          {boards.length > 0 && (
            <ul className="max-h-56 space-y-0.5 overflow-y-auto border-t border-neutral-200 pt-2 dark:border-neutral-800">
              {boards.map((b) => (
                <li key={b.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => {
                      loadBoard(b.cards, b.globalFilter)
                      close()
                    }}
                    className="min-w-0 flex-1 rounded px-1.5 py-1 text-left text-xs
                      hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <span className="block truncate text-neutral-800 dark:text-neutral-200">
                      {b.name}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {b.cards.length} cards · {new Date(b.savedAt).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      deleteBoard(b.id)
                      setBoards(listBoards())
                    }}
                    aria-label={`Delete ${b.name}`}
                    className="rounded px-1 text-neutral-300 opacity-0 transition
                      group-hover:opacity-100 hover:text-red-500"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Menu>
  )
}
