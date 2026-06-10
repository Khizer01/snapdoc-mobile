import React from 'react';
import Svg, { Rect, Line, Path } from 'react-native-svg';
import { colors } from '../theme';

interface LogoProps {
  size?: number;
  color?: string;
}

export function Logo({ size = 80, color = colors.light.primary }: LogoProps) {
  const width = size;
  const height = size * 1.2;
  const docW = width * 0.72;
  const docH = height * 0.78;
  const docX = (width - docW) / 2;
  const docY = (height - docH) / 2;
  const lineXStart = docX + docW * 0.15;
  const lineXEnd = docX + docW * 0.85;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect x={docX} y={docY} width={docW} height={docH} rx={4} ry={4}
        fill="none" stroke={color} strokeWidth={2} />
      <Line x1={lineXStart} y1={docY + docH * 0.3} x2={lineXEnd} y2={docY + docH * 0.3}
        stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={lineXStart} y1={docY + docH * 0.5} x2={lineXEnd} y2={docY + docH * 0.5}
        stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={lineXStart} y1={docY + docH * 0.7} x2={lineXEnd * 0.75} y2={docY + docH * 0.7}
        stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d={`M${docX + docW - 1},${docY - 1} l2,-5 l2,5 l5,2 l-5,2 l-2,5 l-2,-5 l-5,-2 z`}
        fill={color}
      />
    </Svg>
  );
}
