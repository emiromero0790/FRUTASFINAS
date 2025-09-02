import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  value: string;
}

interface AutocompleteInputProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AutocompleteInput({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
  disabled = false
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          listRef.current && !listRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        setSelectedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
          handleSelect(filteredOptions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (option: Option) => {
    setSearchTerm(option.label);
    onChange(option.value);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
    
    // If exact match found, select it
    const exactMatch = options.find(opt => 
      opt.label.toLowerCase() === newValue.toLowerCase() ||
      opt.value.toLowerCase() === newValue.toLowerCase()
    );
    
    if (exactMatch) {
      onChange(exactMatch.value);
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          className={`w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className} ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          placeholder={placeholder}
          autoComplete="off"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.id}
              onClick={() => handleSelect(option)}
              className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              {option.value !== option.label && (
                <div className="text-sm text-gray-500">{option.value}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}