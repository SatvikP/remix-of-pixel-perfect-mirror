import { Check, ChevronDown, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DOMAIN_OPTIONS, DomainOption } from "@/lib/scoring-config";
import { cn } from "@/lib/utils";

interface DomainFilterProps {
  selectedDomains: DomainOption[];
  onDomainsChange: (domains: DomainOption[]) => void;
}

export function DomainFilter({ selectedDomains, onDomainsChange }: DomainFilterProps) {
  const toggleDomain = (domain: DomainOption) => {
    if (selectedDomains.includes(domain)) {
      onDomainsChange(selectedDomains.filter(d => d !== domain));
    } else {
      onDomainsChange([...selectedDomains, domain]);
    }
  };

  const clearAll = () => {
    onDomainsChange([]);
  };

  const getDomainLabel = (value: DomainOption): string => {
    return DOMAIN_OPTIONS.find(d => d.value === value)?.label ?? value;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter by domain</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 bg-popover" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Select domains</span>
              {selectedDomains.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={clearAll}
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1">
              {DOMAIN_OPTIONS.map((domain) => {
                const isSelected = selectedDomains.includes(domain.value);
                return (
                  <button
                    key={domain.value}
                    onClick={() => toggleDomain(domain.value)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/50"
                    )}
                  >
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      isSelected 
                        ? "border-primary bg-primary text-primary-foreground" 
                        : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span>{domain.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected domain badges */}
      {selectedDomains.map((domain) => (
        <Badge
          key={domain}
          variant="secondary"
          className="h-7 gap-1 pr-1.5 font-normal"
        >
          {getDomainLabel(domain)}
          <button
            onClick={() => toggleDomain(domain)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
