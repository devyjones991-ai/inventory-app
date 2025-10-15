declare module "react-window" {
  import * as React from "react";
  
  export interface FixedSizeListProps {
    height: number;
    itemCount: number;
    itemSize: number;
    children: React.ComponentType<{ index: number; style: React.CSSProperties }>;
    className?: string;
    width?: number | string;
  }
  
  export const FixedSizeList: React.ComponentType<FixedSizeListProps>;
  
  export interface VariableSizeListProps {
    height: number;
    itemCount: number;
    itemSize: (index: number) => number;
    children: React.ComponentType<{ index: number; style: React.CSSProperties }>;
    className?: string;
    width?: number | string;
  }
  
  export const VariableSizeList: React.ComponentType<VariableSizeListProps>;
}

