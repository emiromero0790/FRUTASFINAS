import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useProducts } from '../../hooks/useProducts';
import { useClients } from '../../hooks/useClients';
import { DollarSign, Percent, TrendingUp, Users } from 'lucide-react';

export function PreciosVentas() {
  const { products } = useProducts();
  const { clients } = useClients();
  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Precios de Ventas</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Productos Activos">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{products.filter(p => p.status === 'active').length}</div>
              <div className="text-sm text-gray-500">Con precios</div>
            </div>
          </div>
        </Card>

        <Card title="Precio Promedio">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <Percent className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${products.length > 0 ? (products.reduce((sum, p) => sum + (p.price1 || 0), 0) / products.length).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-gray-500">Por producto</div>
            </div>
          </div>
        </Card>

        <Card title="Total Clientes">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{clients.length}</div>
              <div className="text-sm text-gray-500">Registrados</div>
            </div>
          </div>
        </Card>

        <Card title="Productos Totales">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {products.length}
              </div>
              <div className="text-sm text-gray-500">En catálogo</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Lista de Precios de Productos">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-blue-800 font-medium">
                Los precios especiales han sido removidos del sistema. 
                Para gestionar precios, utilice la sección de Catálogos.
              </p>
            </div>
            <div className="space-y-4">
              {products.slice(0, 10).map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">Código: {product.code} | Línea: {product.line}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">${(product.price1 || 0).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">precio actual</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Productos Más Caros">
            <div className="space-y-3">
              {products
                .sort((a, b) => (b.price1 || 0) - (a.price1 || 0))
                .slice(0, 5)
                .map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.line}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        ${(product.price1 || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        precio actual
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card title="Productos Más Baratos">
            <div className="space-y-3">
              {products
                .sort((a, b) => (a.price1 || 0) - (b.price1 || 0))
                .slice(0, 3)
                .map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.line}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ${(product.price1 || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">precio actual</div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}