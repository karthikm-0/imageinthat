import React from "react";

export const GlowFilter: React.FC = () => (
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feFlood result="flood" floodColor="yellow" floodOpacity="1" />
      <feComposite in="flood" result="mask" in2="SourceAlpha" operator="in" />
      <feGaussianBlur in="mask" stdDeviation="5" result="blurred" />
      <feMerge>
        <feMergeNode in="blurred" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

export const ImageWithStyle: React.FC<{
  obj: { x: number; y: number };
  envObject: { width: number; height: number; image: string };
  style: { opacity: number; filter: string };
}> = ({ obj, envObject, style }) => (
  <image
    x={obj.x}
    y={obj.y}
    width={envObject.width}
    height={envObject.height}
    href={envObject.image}
    style={style}
  />
);
