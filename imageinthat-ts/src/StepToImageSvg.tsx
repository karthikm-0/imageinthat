import {
  Environment,
  EnvironmentState,
  getBackground,
  getFullObject,
} from "./interfaces";
import { v4 as uuid } from "uuid";
import React, { useRef, useMemo } from "react";
import { GlowFilter, ImageWithStyle } from "./StepVisuals";
import { highestDimensions } from "./config";

interface StepToImageSvgProps {
  env: Environment;
  envState: EnvironmentState;
  prevEnvState?: EnvironmentState; // Make prevEnvState optional
  className?: string;
  width?: number; // Add optional width prop
  envStates?: EnvironmentState[]; // Make envStates optional
}

const highestWidth = highestDimensions.HIGHEST_WIDTH;
const highestHeight = highestDimensions.HIGHEST_HEIGHT;

export const StepToImageSvg: React.FC<StepToImageSvgProps> = ({
  env,
  envState,
  prevEnvState,
  className,
  width = 256, // Default width to 256 if not provided
  envStates,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const backgroundImage = getBackground(env, envState);
  const previousBackgroundImage = prevEnvState
    ? getBackground(env, prevEnvState)
    : null;

  const backgroundChanged = useMemo(() => {
    return (
      backgroundImage &&
      previousBackgroundImage &&
      backgroundImage !== previousBackgroundImage
    );
  }, [backgroundImage, previousBackgroundImage]);

  const isFirstEnvState = envStates ? envStates[0] === envState : false;

  const getMaskStyle = (
    obj_name: string,
    obj_data: { x: number; y: number }
  ) => {
    let opacity = 1.0;
    let filter = "";
    const unchangedOpacity = 0.2;

    if (envStates && !isFirstEnvState) {
      if (backgroundChanged) {
        opacity = unchangedOpacity;
      } else if (prevEnvState) {
        const prevObj = prevEnvState.objects[obj_name];
        if (prevObj) {
          const distance = Math.sqrt(
            Math.pow(obj_data.x - prevObj.x, 2) +
              Math.pow(obj_data.y - prevObj.y, 2)
          );

          if (distance > 0) {
            filter = "url(#glow)";
          } else {
            opacity = unchangedOpacity;
          }
        }
      }
    }

    return { opacity, filter };
  };

  return (
    <div>
      <svg
        ref={svgRef}
        className={`rounded ${className}`}
        viewBox={`0 0 ${highestWidth} ${highestHeight}`}
        width={width}
      >
        <GlowFilter />
        <image
          x={0}
          y={0}
          width={highestWidth}
          height={highestHeight}
          opacity={
            envStates && isFirstEnvState ? 1 : backgroundChanged ? 1 : 0.5
          }
          href={backgroundImage}
        />
        {envState.objectOrder.map((name) => {
          const obj = getFullObject(name, env, envState);

          const { opacity, filter } = getMaskStyle(obj.name, obj);
          return (
            <ImageWithStyle
              key={uuid()}
              obj={obj}
              envObject={obj}
              style={{ opacity, filter }}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default StepToImageSvg;
