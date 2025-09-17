// components/ui/combobox.tsx

'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ComboboxProps {
  options: { value: string; label: string }[]
  value?: string
  onChange: (value: string) => void
  placeholder?: React.ReactNode
  searchPlaceholder?: string
  emptyMessage?: string
  noResultsMessage?: string
  disabled?: boolean
  loading?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  searchPlaceholder = 'Cari opsi...',
  emptyMessage = 'Tidak ada opsi tersedia.',
  noResultsMessage = 'Opsi tidak ditemukan.',
  disabled = false,
  loading = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedLabel = React.useMemo(() => {
    return options.find((option) => option.value === value)?.label
  }, [options, value])

  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? '' : currentValue)
    setOpen(false)
  }

  const displayContent = value ? selectedLabel : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-0 w-full justify-between font-normal"
          disabled={disabled || loading}
        >
          <div className="truncate flex items-center">{displayContent}</div>

          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          // ✅ Lebar mengikuti trigger + batas max width agar responsif
          'w-[--radix-popover-trigger-width] max-w-xs sm:max-w-sm md:max-w-md p-0'
        )}
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>
              {options.length > 0 ? noResultsMessage : emptyMessage}
            </CommandEmpty>

            {/* ✅ Scrollable area dibatasi tingginya */}
            <ScrollArea className="max-h-[40vh] overflow-y-auto">
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                    className="truncate whitespace-nowrap"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
