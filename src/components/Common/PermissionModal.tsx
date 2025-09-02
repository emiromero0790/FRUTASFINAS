import React from 'react';
import { X, Shield, AlertTriangle } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function PermissionModal({ 
  isOpen, 
  onClose, 
  title = "Permiso Requerido",
  message = "No tienes el permiso para realizar esta acción. El administrador debe asignártelo desde el ERS."
}: PermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="bg-red-600 p-4 border-b border-red-700 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-white" />
              <h3 className="text-white font-bold">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-red-100 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center mb-6">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-900 mb-3">
              Acceso Denegado
            </h4>
            <p className="text-gray-600 text-base leading-relaxed">
              {message}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <p className="text-red-800 font-medium text-sm">
                  Contacta al administrador del sistema para solicitar este permiso.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}