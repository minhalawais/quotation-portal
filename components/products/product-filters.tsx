"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"

interface ProductFiltersProps {
  onFilterChange: (filters: {
    searchTerm: string
    selectedGroup: string
    selectedSubGroup: string
  }) => void
}

export default function ProductFilters({ onFilterChange }: ProductFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("")
  const [selectedSubGroup, setSelectedSubGroup] = useState("")

  // Auto-apply filters when any filter changes
  useEffect(() => {
    onFilterChange({ searchTerm, selectedGroup, selectedSubGroup })
  }, [searchTerm, selectedGroup, selectedSubGroup, onFilterChange])

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedGroup("")
    setSelectedSubGroup("")
  }

  const hasActiveFilters = searchTerm || selectedGroup || selectedSubGroup

  return (
    <div className="card-modern mobile-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Filter className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-secondary">Filter Products</h3>
          <p className="text-sm text-muted-foreground">Search and filter your inventory</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or product ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-modern mobile-input pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Selects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary">Group</label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="input-modern mobile-input">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hosiery">Hosiery</SelectItem>
                <SelectItem value="garments">Garments</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary">Sub-Group</label>
            <Select value={selectedSubGroup} onValueChange={setSelectedSubGroup}>
              <SelectTrigger className="input-modern mobile-input">
                <SelectValue placeholder="All Sub-Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shirts">Shirts</SelectItem>
                <SelectItem value="pants">Pants</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="socks">Socks</SelectItem>
                <SelectItem value="underwear">Underwear</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary">Actions</label>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="w-full mobile-button hover:bg-destructive/5 hover:border-destructive/30 hover:text-destructive"
              disabled={!hasActiveFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm("")} className="hover:bg-primary/20 rounded">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedGroup && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded-md text-xs">
                Group: {selectedGroup}
                <button onClick={() => setSelectedGroup("")} className="hover:bg-secondary/20 rounded">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedSubGroup && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded-md text-xs">
                Sub-Group: {selectedSubGroup}
                <button onClick={() => setSelectedSubGroup("")} className="hover:bg-success/20 rounded">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
