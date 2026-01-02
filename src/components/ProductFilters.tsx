import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Video, Users, FileText, Search, SlidersHorizontal } from "lucide-react";

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

const productTypes = [
  { value: 'all', label: 'Todos', icon: null },
  { value: 'ebook', label: 'E-books', icon: BookOpen },
  { value: 'course', label: 'Cursos', icon: Video },
  { value: 'mentoria', label: 'Mentorias', icon: Users },
  { value: 'template', label: 'Templates', icon: FileText },
];

export const ProductFilters = ({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  sortBy,
  onSortChange,
}: ProductFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar produtos..."
          className="pl-10"
        />
      </div>
      
      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        {productTypes.map((type) => {
          const Icon = type.icon;
          const isActive = selectedType === type.value;
          
          return (
            <Button
              key={type.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onTypeChange(type.value)}
              className={isActive ? "gradient-primary" : ""}
            >
              {Icon && <Icon className="h-4 w-4 mr-1" />}
              {type.label}
            </Button>
          );
        })}
      </div>
      
      {/* Sort */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais Recentes</SelectItem>
            <SelectItem value="price_asc">Menor Preço</SelectItem>
            <SelectItem value="price_desc">Maior Preço</SelectItem>
            <SelectItem value="rating">Melhor Avaliação</SelectItem>
            <SelectItem value="popular">Mais Vendidos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
