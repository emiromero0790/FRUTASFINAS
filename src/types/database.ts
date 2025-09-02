export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string | null;
          name: string;
          email: string;
          role: 'Admin' | 'Gerente' | 'Empleado';
          avatar: string | null;
          almacen: string | null;
          nombre_completo: string | null;
          nombre_usuario: string | null;
          monto_autorizacion: number | null;
          puesto: 'Admin' | 'Vendedor' | 'Chofer' | null;
          rfc: string | null;
          curp: string | null;
          telefono: string | null;
          estatus: boolean | null;
          permisos: Json | null;
          fecha_registro: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_id?: string | null;
          name: string;
          email: string;
          role: 'Admin' | 'Gerente' | 'Empleado';
          avatar?: string | null;
          almacen?: string | null;
          nombre_completo?: string | null;
          nombre_usuario?: string | null;
          monto_autorizacion?: number | null;
          puesto?: 'Admin' | 'Vendedor' | 'Chofer' | null;
          rfc?: string | null;
          curp?: string | null;
          telefono?: string | null;
          estatus?: boolean | null;
          permisos?: Json | null;
          fecha_registro?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string | null;
          name?: string;
          email?: string;
          role?: 'Admin' | 'Gerente' | 'Empleado';
          avatar?: string | null;
          almacen?: string | null;
          nombre_completo?: string | null;
          nombre_usuario?: string | null;
          monto_autorizacion?: number | null;
          puesto?: 'Admin' | 'Vendedor' | 'Chofer' | null;
          rfc?: string | null;
          curp?: string | null;
          telefono?: string | null;
          estatus?: boolean | null;
          permisos?: Json | null;
          fecha_registro?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          code: string;
          line: string;
          subline: string;
          unit: string;
          stock: number; // Now supports decimal values
          cost: number;
          price1: number;
          price2: number;
          price3: number;
          price4: number;
          price5: number;
          status: 'active' | 'disabled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          line: string;
          subline?: string;
          unit?: string;
          stock?: number; // Now supports decimal values
          cost?: number;
          price1?: number;
          price2?: number;
          price3?: number;
          price4?: number;
          price5?: number;
          status?: 'active' | 'disabled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          line?: string;
          subline?: string;
          unit?: string;
          stock?: number; // Now supports decimal values
          cost?: number;
          price1?: number;
          price2?: number;
          price3?: number;
          price4?: number;
          price5?: number;
          status?: 'active' | 'disabled';
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          rfc: string;
          address: string;
          phone: string;
          email: string;
          contact: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rfc: string;
          address?: string;
          phone?: string;
          email?: string;
          contact?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rfc?: string;
          address?: string;
          phone?: string;
          email?: string;
          contact?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          rfc: string;
          address: string;
          phone: string;
          email: string;
          zone: string;
          credit_limit: number;
          balance: number;
          default_price_level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rfc: string;
          address?: string;
          phone?: string;
          email?: string;
          zone?: string;
          credit_limit?: number;
          balance?: number;
          default_price_level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rfc?: string;
          address?: string;
          phone?: string;
          email?: string;
          zone?: string;
          credit_limit?: number;
          balance?: number;
          default_price_level?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          client_id: string;
          client_name: string;
          date: string;
          total: number;
          amount_paid: number | null;
          remaining_balance: number | null;
          status: 'pending' | 'paid' | 'overdue' | 'saved';
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string | null;
          client_name: string;
          date?: string;
          total?: number;
          amount_paid?: number | null;
          remaining_balance?: number | null;
          status?: 'pending' | 'paid' | 'overdue' | 'saved';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          client_name?: string;
          date?: string;
          total?: number;
          amount_paid?: number | null;
          remaining_balance?: number | null;
          status?: 'pending' | 'paid' | 'overdue' | 'saved';
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          price: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          product_name: string;
          quantity?: number;
          price?: number;
          total?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_id?: string;
          product_id?: string;
          product_name?: string;
          quantity?: number;
          price?: number;
          total?: number;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          concept: string;
          amount: number;
          date: string;
          category: string;
          bank_account: string;
          description: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          concept: string;
          amount?: number;
          date?: string;
          category: string;
          bank_account?: string;
          description?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          concept?: string;
          amount?: number;
          date?: string;
          category?: string;
          bank_account?: string;
          description?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_movements: {
        Row: {
          id: string;
          product_id: string;
          product_name: string;
          type: 'entrada' | 'salida' | 'ajuste' | 'merma';
          quantity: number; // Now supports decimal values
          date: string;
          reference: string;
          user_name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          product_name: string;
          type: 'entrada' | 'salida' | 'ajuste' | 'merma';
          quantity?: number; // Now supports decimal values
          date?: string;
          reference?: string;
          user_name: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          product_name?: string;
          type?: 'entrada' | 'salida' | 'ajuste' | 'merma';
          quantity?: number; // Now supports decimal values
          date?: string;
          reference?: string;
          user_name?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          sale_id: string;
          amount: number;
          payment_method: 'cash' | 'card' | 'transfer' | 'credit';
          reference: string;
          date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          amount: number;
          payment_method?: 'cash' | 'card' | 'transfer' | 'credit';
          reference?: string;
          date?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_id?: string;
          amount?: number;
          payment_method?: 'cash' | 'card' | 'transfer' | 'credit';
          reference?: string;
          date?: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
    };
    purchase_orders: {
      Row: {
        id: string;
        supplier_id: string | null;
        supplier_name: string;
        date: string;
        total: number;
        status: 'pending' | 'approved' | 'received' | 'cancelled';
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        supplier_id?: string | null;
        supplier_name: string;
        date?: string;
        total?: number;
        status?: 'pending' | 'approved' | 'received' | 'cancelled';
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        supplier_id?: string | null;
        supplier_name?: string;
        date?: string;
        total?: number;
        status?: 'pending' | 'approved' | 'received' | 'cancelled';
        created_at?: string;
        updated_at?: string;
      };
    };
    purchase_order_items: {
      Row: {
        id: string;
        purchase_order_id: string | null;
        product_id: string | null;
        product_name: string;
        quantity: number | null;
        cost: number | null;
        total: number | null;
        created_at: string;
      };
      Insert: {
        id?: string;
        purchase_order_id?: string | null;
        product_id?: string | null;
        product_name: string;
        quantity?: number | null;
        cost?: number | null;
        total?: number | null;
        created_at?: string;
      };
      Update: {
        id?: string;
        purchase_order_id?: string | null;
        product_id?: string | null;
        product_name?: string;
        quantity?: number | null;
        cost?: number | null;
        total?: number | null;
        created_at?: string;
      };
    };
    bank_movements: {
      Row: {
        id: string;
        fecha: string;
        banco: string;
        cuenta: string;
        tipo: 'deposito' | 'retiro' | 'transferencia' | 'comision';
        concepto: string;
        monto: number;
        saldo_anterior: number;
        saldo_nuevo: number;
        referencia: string;
        created_at: string;
      };
      Insert: {
        id?: string;
        fecha?: string;
        banco: string;
        cuenta: string;
        tipo: 'deposito' | 'retiro' | 'transferencia' | 'comision';
        concepto: string;
        monto: number;
        saldo_anterior?: number;
        saldo_nuevo?: number;
        referencia?: string;
        created_at?: string;
      };
      Update: {
        id?: string;
        fecha?: string;
        banco?: string;
        cuenta?: string;
        tipo?: 'deposito' | 'retiro' | 'transferencia' | 'comision';
        concepto?: string;
        monto?: number;
        saldo_anterior?: number;
        saldo_nuevo?: number;
        referencia?: string;
        created_at?: string;
      };
    };
    expense_concepts: {
      Row: {
        id: string;
        nombre: string;
        categoria: string;
        descripcion: string | null;
        activo: boolean | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        nombre: string;
        categoria: string;
        descripcion?: string | null;
        activo?: boolean | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        nombre?: string;
        categoria?: string;
        descripcion?: string | null;
        activo?: boolean | null;
        created_at?: string;
        updated_at?: string;
      };
    };
    bank_accounts: {
      Row: {
        id: string;
        banco: string;
        numero_cuenta: string;
        tipo: string;
        saldo: number | null;
        activa: boolean | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        banco: string;
        numero_cuenta: string;
        tipo: string;
        saldo?: number | null;
        activa?: boolean | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        banco?: string;
        numero_cuenta?: string;
        tipo?: string;
        saldo?: number | null;
        activa?: boolean | null;
        created_at?: string;
        updated_at?: string;
      };
    };
    warehouses: {
      Row: {
        id: string;
        name: string;
        location: string;
        active: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        name: string;
        location?: string;
        active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        name?: string;
        location?: string;
        active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
    };
    warehouse_stock: {
      Row: {
        id: string;
        warehouse_id: string;
        product_id: string;
        stock: number;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        warehouse_id: string;
        product_id: string;
        stock?: number;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        warehouse_id?: string;
        product_id?: string;
        stock?: number;
        created_at?: string;
        updated_at?: string;
      };
    };
    warehouse_transfers: {
      Row: {
        id: string;
        from_warehouse_id: string;
        to_warehouse_id: string;
        product_id: string;
        product_name: string;
        quantity: number;
        status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
        date: string;
        reference: string;
        notes: string;
        created_by: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        from_warehouse_id: string;
        to_warehouse_id: string;
        product_id: string;
        product_name: string;
        quantity: number;
        status?: 'pending' | 'in_transit' | 'completed' | 'cancelled';
        date?: string;
        reference?: string;
        notes?: string;
        created_by?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        from_warehouse_id?: string;
        to_warehouse_id?: string;
        product_id?: string;
        product_name?: string;
        quantity?: number;
        status?: 'pending' | 'in_transit' | 'completed' | 'cancelled';
        date?: string;
        reference?: string;
        notes?: string;
        created_by?: string | null;
        created_at?: string;
        updated_at?: string;
      };
    };
    cash_movements: {
      Row: {
        id: string;
        fecha: string;
        tipo: 'caja_mayor' | 'deposito_bancario' | 'gasto' | 'pago_proveedor' | 'prestamo' | 'traspaso_caja' | 'otros';
        monto: number;
        cargo: string;
        numero_caja: string;
        descripcion: string;
        usuario: string;
        created_at: string;
      };
      Insert: {
        id?: string;
        fecha?: string;
        tipo: 'caja_mayor' | 'deposito_bancario' | 'gasto' | 'pago_proveedor' | 'prestamo' | 'traspaso_caja' | 'otros';
        monto: number;
        cargo: string;
        numero_caja: string;
        descripcion?: string;
        usuario: string;
        created_at?: string;
      };
      Update: {
        id?: string;
        fecha?: string;
        tipo?: 'caja_mayor' | 'deposito_bancario' | 'gasto' | 'pago_proveedor' | 'prestamo' | 'traspaso_caja' | 'otros';
        monto?: number;
        cargo?: string;
        numero_caja?: string;
        descripcion?: string;
        usuario?: string;
        created_at?: string;
      };
    };
    vales_devolucion: {
      Row: {
        id: string;
        folio_vale: string;
        folio_remision: string;
        fecha_expedicion: string;
        cliente: string;
        importe: number;
        disponible: number;
        estatus: 'HABILITADO' | 'USADO' | 'VENCIDO';
        tipo: string;
        factura: string;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        folio_vale: string;
        folio_remision: string;
        fecha_expedicion?: string;
        cliente: string;
        importe: number;
        disponible?: number;
        estatus?: 'HABILITADO' | 'USADO' | 'VENCIDO';
        tipo?: string;
        factura: string;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        folio_vale?: string;
        folio_remision?: string;
        fecha_expedicion?: string;
        cliente?: string;
        importe?: number;
        disponible?: number;
        estatus?: 'HABILITADO' | 'USADO' | 'VENCIDO';
        tipo?: string;
        factura?: string;
        created_at?: string;
        updated_at?: string;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}