import React, { useState, useEffect } from "react";
import { PathLine } from "react-svg-pathline";
import { Environment, EnvironmentState } from "./interfaces";
import { getFullObject } from "./interfaces";
import { cloneDeep } from "lodash";

type BoundingBox = [number, number, number, number];

interface PossibleManipulationsProps {
  selectedObject: string | undefined;
  env: Environment;
  envState: EnvironmentState;
  colorScheme: string[];
  updateEnvAndEnvStates: (env: Environment, envState: EnvironmentState) => void;
}

const PossibleManipulations: React.FC<PossibleManipulationsProps> = ({
  selectedObject,
  env,
  envState,
  colorScheme,
  updateEnvAndEnvStates,
}) => {
  const [randomCoordinates, setRandomCoordinates] = useState<
    Record<string, { x: number; y: number }>
  >({});

  useEffect(() => {
    if (selectedObject) {
      const newRandomCoordinates: Record<string, { x: number; y: number }> = {};
      getPossiblePlaces(selectedObject).forEach((place) => {
        const fixtureObject = env.fixtures[place];
        if (fixtureObject && fixtureObject.boundingBox) {
          newRandomCoordinates[place] = getRandomCoordinatesFromBoundingBox(
            fixtureObject.boundingBox
          );
        }
      });
      setRandomCoordinates(newRandomCoordinates);
    }
  }, [selectedObject, env]);

  const getPossiblePlaces = (objectKey: string) => {
    const manipulation = env.possibleManipulations?.find(
      (manip) => manip.unique_name === objectKey
    );
    return manipulation?.places || [];
  };

  const getRandomCoordinatesFromBoundingBox = (boundingBox: BoundingBox) => {
    const [x, y, xmax, ymax] = boundingBox;
    const randomX = x + Math.random() * (xmax - x); // Random x within the bounding box
    const randomY = y + Math.random() * (ymax - y); // Random y within the bounding box
    return { x: randomX, y: randomY };
  };

  return (
    <>
      {getPossiblePlaces(selectedObject).map((place, index) => {
        const placeObject = envState.objects[place];
        const fixtureObject = env.fixtures[place];
        const envObject = getFullObject(selectedObject, env, envState);
        // Determine if the place is an object or a fixture
        const isObject = !!placeObject;
        const target = isObject ? placeObject : fixtureObject;

        if (!target) return null;

        //console.log("Place:", place);
        //console.log("Is object:", isObject);

        //console.log("Random coordinates:", randomCoordinates);

        const targetX = isObject
          ? target.x + env.objects[place].width / 2 // Center of the target object
          : randomCoordinates[place]?.x; // Random x-coordinate for the fixture

        const targetY = isObject
          ? target.y + env.objects[place].height / 2 // Center of the target object
          : randomCoordinates[place]?.y; // Random y-coordinate for the fixture

        // Check for undefined coordinates
        if (targetX === undefined || targetY === undefined) {
          console.error(`Undefined coordinates for place: ${place}`);
          return null;
        }

        // Pick a color from the color scheme based on the index
        const strokeColor = colorScheme[index % colorScheme.length];

        const points = [
          {
            x: envObject.x + envObject.width / 2,
            y: envObject.y + envObject.height / 2,
          },
          {
            x: targetX,
            y: targetY,
          },
        ];

        return (
          <React.Fragment key={place}>
            {/* Invisible thicker line for easier clicking */}
            <PathLine
              points={points}
              stroke="transparent"
              strokeWidth={20} // Thicker stroke for easier clicking
              fill="none"
              onClick={(event) => {
                event.stopPropagation();
                console.log(`Line clicked from ${selectedObject} to ${place}`);

                // Move the selected object to the location of the clicked line
                const tempObjects = cloneDeep(envState.objects);
                const newObject = tempObjects[selectedObject];
                const newObjectFull = getFullObject(
                  selectedObject,
                  env,
                  envState
                );

                if (!newObject) {
                  throw new Error("Object not found");
                }

                if (isObject) {
                  newObject.x =
                    target.x +
                    (env.objects[place].width - newObjectFull.width) / 2;
                  newObject.y =
                    target.y +
                    (env.objects[place].height - newObjectFull.height) / 2;
                } else {
                  const { x: randomX, y: randomY } = randomCoordinates[place];
                  newObject.x = randomX - newObjectFull.width / 2;
                  newObject.y = randomY - newObjectFull.height / 2;
                }

                updateEnvAndEnvStates(env, {
                  ...envState,
                  objects: tempObjects,
                });
              }}
            />
            {/* Actual visible line */}
            <PathLine
              points={points}
              stroke={strokeColor}
              strokeWidth={3}
              fill="none"
              strokeDasharray="5,5"
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default PossibleManipulations;
