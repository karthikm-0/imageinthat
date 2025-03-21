import { EnvironmentState, Environment } from "./interfaces";
import { getBackground } from "./interfaces";

import { highestDimensions } from "./config";

const highestWidth = highestDimensions.HIGHEST_WIDTH;
const highestHeight = highestDimensions.HIGHEST_HEIGHT;

export const isObjectWithinClosedFixture = (
  object: { x: number; y: number },
  env: Environment,
  envState: EnvironmentState
): boolean => {
  return Object.entries(env.fixtures).some(([key, fixture]) => {
    const [xmin, ymin, xmax, ymax] = fixture.boundingBox;
    const fixtureState = envState.fixtures[key];
    return (
      fixtureState === "closed" &&
      object.x >= xmin &&
      object.x <= xmax &&
      object.y >= ymin &&
      object.y <= ymax
    );
  });
};


// Function to generate a combined image from the environment and state
export const generateCombinedImage = async (
  env: Environment,
  state: EnvironmentState
): Promise<string> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Assuming all objects have the same dimensions for simplicity

  canvas.width = highestWidth;
  canvas.height = highestHeight;

  // Get the background image using getBackground function
  const backgroundImageSrc = getBackground(env, state);

  // Draw the background image
  if (backgroundImageSrc) {
    const backgroundImage = new Image();
    backgroundImage.src = backgroundImageSrc;
    await new Promise((resolve) => {
      backgroundImage.onload = () => {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        resolve(null);
      };
    });
  }

  // Draw objects
  for (const [objectKey, objectState] of Object.entries(state.objects)) {
    const object = env.objects[objectKey];
    if (object && !isObjectWithinClosedFixture(objectState, env, state)) {
      const objectImage = new Image();
      objectImage.src = object.image;
      await new Promise((resolve) => {
        objectImage.onload = () => {
          ctx.drawImage(
            objectImage,
            objectState.x,
            objectState.y,
            object.width,
            object.height
          );
          resolve(null);
        };
      });
    }
  }

  return canvas.toDataURL("image/png");
};
