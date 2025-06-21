"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"

export default function ProductFilters() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("")
  const [selectedSubGroup, setSelectedSubGroup] = useState("")

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
      <div className="flex items-center space-x-2">
        <Filter className="h-5 w-5 text-gray-500" />
        <h3 className="font-medium text-gray-900">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger>
            <SelectValue placeholder="Select Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hosiery">Hosiery</SelectItem>
            <SelectItem value="garments">Garments</SelectItem>
            <SelectItem value="accessories">Accessories</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSubGroup} onValueChange={setSelectedSubGroup}>
          <SelectTrigger>
            <SelectValue placeholder="Select Sub-Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="shirts">Shirts</SelectItem>
            <SelectItem value="pants">Pants</SelectItem>
            <SelectItem value="accessories">Accessories</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="w-full">
          Clear Filters
        </Button>
      </div>
    </div>
  )
}
