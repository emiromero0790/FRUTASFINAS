import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  title: string;
  searchable?: boolean;
  exportable?: boolean;
  itemsPerPage?: number;
}

export function DataTable({ 
  data, 
  columns, 
  title, 
  searchable = true, 
  exportable = true,
  itemsPerPage = 10 
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Filter data based on search term
  const filteredData = data.filter(item =>
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort data
  const sortedData = [...filteredData];
  if (sortConfig) {
    sortedData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    const headers = columns.map(col => col.label).join(',');
    const rows = filteredData.map(item =>
      columns.map(col => item[col.key] || '').join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_ffd.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
      
        <meta charset="UTF-8">



        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
           .logo { text-align: center; margin-bottom: 20px; }
    .logo img { max-width: 200px; height: auto; } /* aquí ajustas el tamaño */
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 10px; }
          .title { font-size: 24px; font-weight: bold; color: #1F2937; margin-bottom: 5px; }
          .date { font-size: 12px; color: #6B7280; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #3B82F6; color: white; padding: 12px 8px; text-align: left; font-weight: bold; }
          td { padding: 8px; border-bottom: 1px solid #E5E7EB; }
          tr:nth-child(even) { background-color: #F9FAFB; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 10px; }
          .summary { background-color: #EFF6FF; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
  <div class="logo">
    <img 
      src="https://raw.githubusercontent.com/Aquilini-0-0/Abarrotes/main/public/logoduran2.png" 
      alt="DURAN"
    />
  </div>
        <div class="header">
          <div class="title">${title}</div>
          <div class="date">Generado el ${new Date().toLocaleString('es-MX')}</div>
        </div>
        
        <div class="summary">
          <strong>Resumen:</strong> ${filteredData.length} registros encontrados
        </div>
        
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredData.map(item => `
              <tr>
                ${columns.map(col => {
                  let value = item[col.key] || '';
                  if (col.render && typeof value !== 'object') {
                    // For simple renders, try to extract text content
                    if (typeof value === 'number' && col.key.includes('amount') || col.key.includes('total') || col.key.includes('price') || col.key.includes('cost')) {
                      value = `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
                    } else if (col.key.includes('date') && value) {
                      value = new Date(value).toLocaleDateString('es-MX');
                    }
                  }
                  return `<td>${value}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Sistema ERP DURAN - Reporte generado automáticamente</p>
          <p>Total de registros: ${filteredData.length}</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_ffd.html`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    // Also create a print-friendly version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2 lg:space-x-4">
            {searchable && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-32 lg:w-auto pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Buscar..."
                />
              </div>
            )}
            {exportable && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportToCSV}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download size={16} />
                  <span>Exportar CSV</span>
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Download size={16} />
                  <span>Exportar PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  {column.label}
                  {sortConfig?.key === column.key && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 lg:px-6 py-3 border-t border-gray-200 flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <div className="text-sm text-gray-700 order-2 lg:order-1">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} de {filteredData.length} registros
          </div>
          <div className="flex items-center space-x-2 order-1 lg:order-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}