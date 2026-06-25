declare module 'react-slider' {
  interface ReactSliderProps {
    className?: string;
    thumbClassName?: string;
    trackClassName?: string;
    min?: number;
    max?: number;
    step?: number;
    value?: number | number[];
    onChange?: (value: number | number[]) => void;
    renderThumb?: (props: any, state: any) => React.ReactNode;
    renderTrack?: (props: any, state: any) => React.ReactNode;
    [key: string]: any;
  }

  const ReactSlider: React.ComponentType<ReactSliderProps>;
  export default ReactSlider;
}
