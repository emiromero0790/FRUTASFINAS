declare global {
  interface Window {
    triggerSync?: () => void;
    refreshData?: () => void;
    tempTaraData?: {
      product: any;
      finalQuantity: number;
      priceLevelFromModal: number;
      finalUnitPrice: number;
    } | null;
  }
}

export {};