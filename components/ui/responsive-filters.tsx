"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface FilterOption {
  value: string
  label: string
}

interface ResponsiveFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: {
    name: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
  }[]
  className?: string
}

export function ResponsiveFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters = [],
  className,
}: ResponsiveFiltersProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {filters.map((filter, index) => (
        <select
          key={index}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm min-w-[150px]"
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
        >
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  )
}
