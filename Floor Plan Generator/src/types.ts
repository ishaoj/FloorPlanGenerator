export interface Room {
  id: string;
  type: string;
  size: {
    length: number;
    width: number;
  };
  position: {
    x: number;
    y: number;
  };
  direction: string;
  preferences?: {
    hasAttachedWashroom?: boolean;
    isOpen?: boolean;
    isInside?: boolean;
    isCombined?: boolean;
  };
}

export interface PlotDimensions {
  length: number;
  width: number;
}

export interface VastuRule {
  direction: string;
  defaultSize: {
    length: number;
    width: number;
  };
  description: string;
  preferences?: {
    hasAttachedWashroom?: boolean;
    isOpen?: boolean;
    isInside?: boolean;
    isCombined?: boolean;
  };
}