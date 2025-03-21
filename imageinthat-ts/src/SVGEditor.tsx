import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import { cloneDeep } from "lodash";
import {
  EnvironmentAndEnvironmentStates,
  Environment,
  EnvironmentState,
} from "./interfaces";
import { getBackground, getFullObject } from "./interfaces";
import PossibleManipulations from "./PossibleManipulations";
import { useExperiment } from "@hcikit/react";
import { isObjectWithinClosedFixture } from "./imageUtils";

import { highestDimensions } from "./config";

const highestWidth = highestDimensions.HIGHEST_WIDTH;
const highestHeight = highestDimensions.HIGHEST_HEIGHT;

export const SVGEditor: React.FC<{
  selectedIndex: number | null;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  env: Environment;
  envState: EnvironmentState;
  setEnvAndEnvStates: React.Dispatch<
    React.SetStateAction<EnvironmentAndEnvironmentStates>
  >;
  updateEnvAndEnvStates: (env: Environment, envState: EnvironmentState) => void;
  setLastObjectMoved: React.Dispatch<React.SetStateAction<string | undefined>>;
  showPossibleManipulations?: boolean;
}> = ({
  env,
  envState,
  setEnvAndEnvStates,
  updateEnvAndEnvStates,
  selectedIndex,
  setSelectedIndex,
  setLastObjectMoved, // Destructure the prop
  showPossibleManipulations = true,
}) => {
  const { log } = useExperiment();
  const [selectedObject, setSelectedObject] = useState<string | undefined>(
    undefined
  );
  const [hoveredObject, setHoveredObject] = useState<string | null>(null); // New state for hovered object
  const [hoveredFixture, setHoveredFixture] = useState<string | null>(null);
  const [objectPositions, setObjectPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [allowClick, setAllowClick] = useState<boolean>(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    key: string;
  } | null>(null);

  const handleFixtureClick = (fixtureName: string) => {
    console.log(fixtureName + " clicked.");
    if (isDragging) return;

    const matchingFixtureKey = Object.keys(envState.fixtures).find(
      (key) => key === fixtureName
    );
    if (!matchingFixtureKey) {
      console.error(
        `Fixture with name ${fixtureName} not found in current state.`
      );
      return;
    }
    console.log("Matching fixture key: " + matchingFixtureKey);

    const fixtureState = envState.fixtures[matchingFixtureKey];
    const possibleStates = env.fixtures[fixtureName]?.possibleStates;
    if (!possibleStates) {
      console.error(`Possible states for fixture ${fixtureName} not found.`);
      return;
    }

    const otherState = possibleStates.find((state) => state !== fixtureState);
    if (!otherState) {
      console.error(`No other state found for fixture ${fixtureName}.`);
      return;
    }

    const isAnyStovetopOn = Object.keys(envState.fixtures).some((key) => {
      return (
        key.startsWith("stove") &&
        envState.fixtures[key] === "on" &&
        key !== matchingFixtureKey
      );
    });

    if (isAnyStovetopOn && otherState === "on") {
      console.error(`Another stovetop is already on. Turn it off first.`);
      return;
    }

    const updatedFixtures = {
      ...envState.fixtures,
      [matchingFixtureKey]: otherState,
    };

    const updatedObjects = { ...envState.objects };
    if (otherState === "closed") {
      Object.keys(updatedObjects).forEach((key) => {
        const object = updatedObjects[key];
        const [xmin, ymin, xmax, ymax] = env.fixtures[fixtureName].boundingBox;
        if (
          object.x >= xmin &&
          object.x <= xmax &&
          object.y >= ymin &&
          object.y <= ymax
        ) {
          updatedObjects[key].hidden = true;
        }
      });
    } else {
      Object.keys(updatedObjects).forEach((key) => {
        const object = updatedObjects[key];
        const [xmin, ymin, xmax, ymax] = env.fixtures[fixtureName].boundingBox;
        if (
          object.x >= xmin &&
          object.x <= xmax &&
          object.y >= ymin &&
          object.y <= ymax
        ) {
          updatedObjects[key].hidden = false;
        }
      });
    }

    const capitalizedFixtureName = capitalizeFirstLetter(fixtureName);

    const updatedState = {
      ...envState,
      fixtures: updatedFixtures,
      objects: updatedObjects,
      caption: capitalizedFixtureName + " " + otherState + ".",
    };

    setEnvAndEnvStates((prevEnvAndEnvStates) => {
      const selectedIndex = prevEnvAndEnvStates.envStates.length - 1;
      const currentEnvState = prevEnvAndEnvStates.envStates[selectedIndex];

      if (
        selectedIndex !== null &&
        selectedIndex >= 0 &&
        selectedIndex < prevEnvAndEnvStates.envStates.length
      ) {
        const newEnvStates = [
          ...prevEnvAndEnvStates.envStates.slice(0, selectedIndex),
          currentEnvState,
          updatedState,
          ...prevEnvAndEnvStates.envStates.slice(selectedIndex + 1),
        ];

        log({
          type: "newEnvStateCreated",
          action: "fixtureClick",
          fixtureName: fixtureName,
          fixtureType: env.fixtures[fixtureName]?.category,
          oldFixtureState: fixtureState,
          newFixtureState: otherState,
          oldEnvState: currentEnvState,
          newEnvState: updatedState,
          oldEnvStates: prevEnvAndEnvStates.envStates,
          newEnvStates: newEnvStates,
        });

        setSelectedIndex(selectedIndex + 1);
        setSelectedObject(undefined);
        setLastObjectMoved(undefined);
        return {
          env: prevEnvAndEnvStates.env,
          envStates: [
            ...prevEnvAndEnvStates.envStates.slice(0, selectedIndex),
            currentEnvState,
            updatedState,
            ...prevEnvAndEnvStates.envStates.slice(selectedIndex + 1),
          ],
        };
      } else {
        setSelectedIndex(prevEnvAndEnvStates.envStates.length);
        setSelectedObject(undefined);
        setLastObjectMoved(undefined);
        return {
          env: prevEnvAndEnvStates.env,
          envStates: [...prevEnvAndEnvStates.envStates, updatedState],
        };
      }
    });
  };

  const backgroundImage = getBackground(env, envState);

  const handleClick = (event: React.MouseEvent<SVGElement, MouseEvent>) => {
    const svg = event.currentTarget as SVGSVGElement;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());

    Object.entries(env.fixtures).forEach(([key, fixture]) => {
      const [xmin, ymin, xmax, ymax] = fixture.boundingBox;
      if (
        svgPoint.x >= xmin &&
        svgPoint.x <= xmax &&
        svgPoint.y >= ymin &&
        svgPoint.y <= ymax
      ) {
        if (allowClick) handleFixtureClick(key);
      }
    });
  };

  const handleMouseEnter = (fixtureName: string) => {
    const possibleStates = env.fixtures[fixtureName]?.possibleStates;
    if (possibleStates && possibleStates.length > 1) {
      setHoveredFixture(fixtureName);
    }
  };

  const handleMouseLeave = () => {
    setHoveredFixture(null);
  };

  const handleObjectClick = (
    event: React.MouseEvent<SVGGElement, MouseEvent>,
    key: string
  ) => {
    event.stopPropagation();
    if (event.type === "contextmenu") {
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY, key });
    } else {
      setSelectedObject(key);
      setContextMenu(null); // Hide context menu when selecting another object
    }
  };

  const handleContextMenuOptionClick = (key: string) => {
    setEnvAndEnvStates((prevEnvAndEnvStates) => {
      const newObjectOrder = prevEnvAndEnvStates.envStates[
        prevEnvAndEnvStates.envStates.length - 1
      ].objectOrder.filter((objectKey) => objectKey !== key);
      newObjectOrder.push(key);

      const updatedEnvState = {
        ...prevEnvAndEnvStates.envStates[
          prevEnvAndEnvStates.envStates.length - 1
        ],
        objectOrder: newObjectOrder,
      };

      const newEnvStates = [
        ...prevEnvAndEnvStates.envStates.slice(
          0,
          prevEnvAndEnvStates.envStates.length - 1
        ),
        updatedEnvState,
      ];

      log({
        type: "objectMovedToFront",
        object: key,
        oldOrder:
          prevEnvAndEnvStates.envStates[
            prevEnvAndEnvStates.envStates.length - 1
          ].objectOrder,
        newOrder: newObjectOrder,
        oldEnvState:
          prevEnvAndEnvStates.envStates[
            prevEnvAndEnvStates.envStates.length - 1
          ],
        newEnvState: updatedEnvState,
        oldEnvStates: prevEnvAndEnvStates.envStates,
        newEnvStates: newEnvStates,
      });

      return {
        ...prevEnvAndEnvStates,
        envStates: newEnvStates,
      };
    });
    setContextMenu(null);
  };

  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    envState.objectOrder.forEach((key) => {
      const object = envState.objects[key];
      positions[key] = { x: object.x, y: object.y };
    });
    setObjectPositions(positions);
  }, [envState]);

  const colorScheme = [
    "#3B82F6", // Blue-500
    "#EF4444", // Red-500
    "#10B981", // Green-500
    "#F59E0B", // Yellow-500
    "#8B5CF6", // Purple-500
    "#EC4899", // Pink-500
    "#06B6D4", // Cyan-500
    "#F97316", // Orange-500
    "#84CC16", // Lime-500
    "#6366F1", // Indigo-500
  ];

  return (
    <div>
      <svg
        className="rounded"
        width={highestWidth}
        height={highestHeight}
        viewBox={`0 0 ${highestWidth} ${highestHeight}`}
        onClick={handleClick}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feFlood result="flood" floodColor="#FFD700" floodOpacity="1" />
            <feComposite
              in="flood"
              result="mask"
              in2="SourceGraphic"
              operator="in"
            />
            <feGaussianBlur in="mask" stdDeviation="3.5" result="blurred" />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <image
          x={0}
          y={0}
          width={highestWidth}
          height={highestHeight}
          href={backgroundImage}
        />

        {Object.entries(env.fixtures).map(([key, fixture]) => {
          const [xmin, ymin, xmax, ymax] = fixture.boundingBox;
          const fixtureState = envState.fixtures[key];
          const fixtureCategory = env.fixtures[key]?.category;

          const centerX = (xmin + xmax) / 2;
          const centerY = (ymin + ymax) / 2;

          return (
            <g
              key={key}
              onMouseEnter={() => handleMouseEnter(key)}
              onMouseLeave={handleMouseLeave}
            >
              <rect
                x={xmin}
                y={ymin}
                width={xmax - xmin}
                height={ymax - ymin}
                fill="transparent"
                stroke="red"
                opacity={0}
                strokeWidth={2}
              />
              <text
                x={centerX}
                y={centerY}
                fill="red"
                fontSize="12"
                fontFamily="Arial"
                opacity={0}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {key}
              </text>
              {!isDragging && allowClick && hoveredFixture === key && (
                <foreignObject
                  x={centerX - 75}
                  y={centerY - 15}
                  width={150}
                  height={30}
                >
                  <div className="bg-white bg-opacity-75 text-gray-700 px-1 py-1 rounded text-xs font-sans inline-block">
                    <span className="font-medium">
                      {`${
                        fixtureCategory.charAt(0).toUpperCase() +
                        fixtureCategory.slice(1)
                      }:`}
                    </span>
                    <strong>{` ${fixtureState}`}</strong>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}

        {envState.objectOrder.map((key) => {
          const object = envState.objects[key];
          if (object.hidden) {
            return null; // Skip rendering this object if it's marked as hidden
          }
          return (
            <Draggable
              key={key}
              position={{ x: object.x, y: object.y }}
              onStart={() => {
                setSelectedObject(key);
                setIsDragging(true);
                setAllowClick(false);

                log({
                  type: "objectDragStart",
                  object: key,
                  position: object,
                });
              }}
              onStop={(_, dragData) => {
                setIsDragging(false);
                const tempObjects = cloneDeep(envState.objects);
                const newObject = tempObjects[key];

                if (!newObject) {
                  throw new Error("Object not found");
                }

                newObject.x = dragData.x;
                newObject.y = dragData.y;

                log({
                  type: "objectDragEnd",
                  object: key,
                  position: newObject,
                });

                updateEnvAndEnvStates(env, {
                  ...envState,
                  objects: tempObjects,
                });

                setTimeout(() => setAllowClick(true), 500);
                console.log("Allowing clicks again.");
              }}
            >
              <g
                onClick={(event) => handleObjectClick(event, key)}
                onContextMenu={(event) => handleObjectClick(event, key)}
                onMouseEnter={() => setHoveredObject(key)}
                onMouseLeave={() => setHoveredObject(null)}
                filter={
                  key === selectedObject || key === hoveredObject
                    ? "url(#glow)"
                    : ""
                }
              >
                <ObjectComponent
                  selected={key === selectedObject}
                  object={getFullObject(key, env, envState)}
                />
              </g>
            </Draggable>
          );
        })}

        {!isDragging && showPossibleManipulations && (
          <PossibleManipulations
            selectedObject={selectedObject}
            env={env}
            envState={envState}
            colorScheme={colorScheme}
            updateEnvAndEnvStates={updateEnvAndEnvStates}
          />
        )}
      </svg>

      {contextMenu && (
        <div
          className="absolute bg-white border border-gray-300 rounded shadow-lg z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <ul className="list-none m-0 p-0">
            <li
              className="px-4 py-2 cursor-pointer text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuOptionClick(contextMenu.key)}
            >
              Move to Front
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

const ObjectComponent: React.FC<{
  object: Environment["objects"][string];
  selected: boolean;
}> = ({ object, selected }) => {
  return (
    <g>
      <image width={object.width} height={object.height} href={object.image} />
    </g>
  );
};

export default SVGEditor;

// Utility function to capitalize the first letter of a string
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
