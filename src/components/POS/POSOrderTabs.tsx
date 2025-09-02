import React, { useState } from 'react';
import { X, Plus, User, Lock, AlertTriangle } from 'lucide-react';
import { POSOrder } from '../../types/pos';

interface OrderTab {
  id: string;
  order: POSOrder;
  isActive: boolean;
  isLocked?: boolean;
  lockedBy?: string;
}

interface POSOrderTabsProps {
  tabs: OrderTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

export function POSOrderTabs({ tabs, activeTabId, onTabChange, onTabClose, onNewTab }: POSOrderTabsProps) {
  const [showCloseConfirm, setShowCloseConfirm] = useState<string | null>(null);

  const handleCloseTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.order.items.length > 0 && tab.order.status === 'draft') {
      setShowCloseConfirm(tabId);
    } else {
      onTabClose(tabId);
    }
  };

  const confirmCloseTab = (tabId: string) => {
    onTabClose(tabId);
    setShowCloseConfirm(null);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-2 py-1">
      <div className="flex items-center space-x-1 overflow-x-auto">
        {/* Existing Tabs */}
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center space-x-2 px-3 py-2 rounded-t-lg border-b-2 transition-all cursor-pointer min-w-0 max-w-xs ${
              tab.isActive
                ? 'bg-orange-50 border-orange-500 text-orange-700'
                : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {/* Lock indicator */}
            {tab.isLocked && (
              <Lock size={12} className="text-red-500 flex-shrink-0" title={`Bloqueado por ${tab.lockedBy}`} />
            )}
            
            {/* Client icon */}
            <User size={14} className="flex-shrink-0" />
            
            {/* Tab content */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">
                {tab.order.client_name || 'Sin cliente'}
              </div>
              <div className="text-xs text-gray-500">
                #{tab.order.id.slice(-6)} • ${tab.order.total.toFixed(0)}
              </div>
            </div>
            
            {/* Status indicator */}
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              tab.order.status === 'paid' ? 'bg-green-500' :
              tab.order.status === 'pending' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`} />
            
            {/* Close button */}
            {!tab.isLocked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(tab.id);
                }}
                className="text-gray-400 hover:text-red-500 flex-shrink-0"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {/* New Tab Button */}
        <button
          onClick={onNewTab}
          className="flex items-center space-x-1 px-3 py-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-t-lg transition-colors flex-shrink-0"
          title="Nuevo pedido"
        >
          <Plus size={14} />
          <span className="text-xs">Nuevo</span>
        </button>
      </div>

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar Cierre de Pestaña
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Este pedido tiene productos agregados. ¿Está seguro de cerrar la pestaña? 
                Los cambios no guardados se perderán.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => confirmCloseTab(showCloseConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Cerrar Pestaña
                </button>
                <button
                  onClick={() => setShowCloseConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}