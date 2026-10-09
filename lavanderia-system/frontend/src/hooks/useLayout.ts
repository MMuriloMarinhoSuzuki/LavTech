import { useOutletContext } from 'react-router-dom';

export interface LayoutContext {
  onMenuClick: () => void;
}

export function useLayout() {
  return useOutletContext<LayoutContext>();
}