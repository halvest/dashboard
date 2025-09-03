'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button' // <-- Path diperbaiki menggunakan alias
import { FileText, Home, Plus, Search } from 'lucide-react'

export function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => unknown) => {
    setOpen(false)
    command()
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-9 w-9 p-0 sm:w-auto sm:px-4 sm:py-2 text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline-block">Cari...</span>
        <kbd className="hidden sm:inline-flex ml-4 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Ketik perintah atau cari..." />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>
          <CommandGroup heading="Navigasi">
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Dasbor</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/hki'))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Data HKI</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Aksi">
            <CommandItem onSelect={() => runCommand(() => router.push('/hki/create'))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Buat Entri HKI Baru</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}