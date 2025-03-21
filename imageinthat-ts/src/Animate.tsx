import { motion } from "framer-motion";
import { useState } from "react";
import {
  EnvironmentAndEnvironmentStates,
  EnvironmentState,
  Environment,
  getFullObject,
  getBackground,
} from "./interfaces";
import { GlowFilter } from "./StepVisuals";
import { highestDimensions } from "./config";

const millisecondsPerStep = 1000;

const highestWidth = highestDimensions.HIGHEST_WIDTH;
const highestHeight = highestDimensions.HIGHEST_HEIGHT;

export const AnimateBetweenSteps: React.FC<{
  envAndEnvStates: EnvironmentAndEnvironmentStates;
}> = ({ envAndEnvStates }) => {
  const [curStep] = useState(1);

  return (
    <StepVisualisation
      env={envAndEnvStates.env}
      currentState={envAndEnvStates.envStates[curStep]}
      initialState={envAndEnvStates.envStates[0]}
    />
  );
};

export const StepVisualisation: React.FC<{
  env: Environment;
  currentState: EnvironmentState;
  initialState: EnvironmentState;
}> = ({ env, currentState, initialState }) => {
  // Get the background image using the getBackground function
  const initialBackgroundImage = getBackground(env, initialState);
  const currentBackgroundImage = getBackground(env, currentState);

  return (
    <svg
      className="h-[256px] w-[256px]"
      viewBox={`0 0 ${highestWidth} ${highestHeight}`}
      width={256}
    >
      <GlowFilter />
      {initialBackgroundImage && (
        <image
          x={0}
          y={0}
          width={highestWidth}
          height={highestHeight}
          href={initialBackgroundImage}
        />
      )}
      {currentBackgroundImage && (
        <motion.image
          x={0}
          y={0}
          width={highestWidth}
          height={highestHeight}
          href={currentBackgroundImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            type: "tween",
            repeatType: "loop",
            repeat: Infinity,
            duration: millisecondsPerStep / 1000,
          }}
        />
      )}
      {currentState.objectOrder.map((name) => {
        const obj = getFullObject(name, env, currentState);
        const initialObject = initialState.objects[name] || { x: 0, y: 0 };

        return (
          <motion.image
            key={name}
            initial={{
              x: initialObject.x,
              y: initialObject.y,
            }}
            animate={{ x: obj.x, y: obj.y }}
            transition={{
              type: "tween",
              repeatType: "loop",
              repeat: Infinity,
              duration: millisecondsPerStep / 1000,
            }}
            href={obj.image}
            width={obj.width}
            height={obj.height}
          />
        );
      })}
    </svg>
  );
};
