import { StepInterface, Environment, EnvironmentState } from "./interfaces";

function removeImageData(env: Environment): {
  envWithoutImages: Environment;
  originalImages: Record<string, string>;
} {
  // Create a deep copy of the environment data
  const envCopy = JSON.parse(JSON.stringify(env));
  const originalImages: Record<string, string> = {};

  // Iterate through the copied data and remove the "image" key from each object
  for (const objKey in envCopy.objects) {
    if (envCopy.objects[objKey].image) {
      originalImages[objKey] = envCopy.objects[objKey].image;
      delete envCopy.objects[objKey].image;
    }
  }

  // Remove the image data from the backgrounds key
  for (const key in envCopy.backgrounds) {
    originalImages[key] = envCopy.backgrounds[key];
    envCopy.backgrounds[key] = null;
  }

  return { envWithoutImages: envCopy, originalImages };
}

export function restoreImageData(
  env: Environment,
  originalImages: Record<string, string>
): Environment {
  const envCopy = JSON.parse(JSON.stringify(env));

  // Restore the image data to the objects
  for (const objKey in originalImages) {
    if (envCopy.objects[objKey]) {
      envCopy.objects[objKey].image = originalImages[objKey];
    } else if (envCopy.backgrounds[objKey] !== undefined) {
      envCopy.backgrounds[objKey] = originalImages[objKey];
    }
  }

  return envCopy;
}

export async function sendStepData(
  endpoint: string,
  data?: {
    text?: string;
    image?: string;
    images?: string[];
    type?: "url" | "raw";
    stepData?: StepInterface; // Add stepData to the data object
    stepDataArray?: StepInterface[]; // Add stepDataArray to the data object
  }
): Promise<EnvironmentAndEnvironmentStates> {
  console.log("Endpoint:", endpoint);
  const port = 5000;

  const host = "localhost";
  // const host = "172.21.88.58";
  const url = `http://${host}:${port}${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : null, // Send data if provided, otherwise send null
  });

  // Check if the response contains an array or a single object
  const responseData = await response.json();
  if (typeof responseData === "string") {
    return responseData;
  } else if (Array.isArray(responseData)) {
    return responseData as StepInterface[];
  } else {
    return responseData as StepInterface;
  }
}

export async function sendEnvAndEnvStatesData(
  endpoint: string,
  data: {
    env: Environment;
    envStates: EnvironmentState[];
    images: string[];
    text?: string;
  }
) {
  console.log("Endpoint:", endpoint);
  const port = 5000;

  // Remove image data from the environment before sending
  const { envWithoutImages } = removeImageData(data.env);

  const host = "localhost";
  // const host = "172.21.88.58";
  const url = `http://${host}:${port}${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...data, env: envWithoutImages }), // Send the modified data
  });

  // Check if the response contains an array or a single object
  const responseData = await response.json();
  let result;
  if (typeof responseData === "string") {
    result = responseData;
    console.log("Response:", result);
    return result;
  } else if (isEnvironmentState(responseData)) {
    result = responseData as EnvironmentState;
    console.log("Response:", result);
    return result;
  } else if (
    Array.isArray(responseData) &&
    responseData.every(isEnvironmentState)
  ) {
    result = responseData as EnvironmentState[];
    console.log("Response:", result);
    return result;
  } else {
    console.error("Unexpected response format:", responseData);
    throw new Error("Unexpected response format");
  }
}

// Type guard to check if the response is an EnvironmentState
function isEnvironmentState(data: unknown): data is EnvironmentState {
  return (
    typeof data === "object" &&
    data !== null &&
    "fixtures" in data &&
    "objectOrder" in data &&
    "objects" in data
  );
}

export const generateNextStates = async (
  inputValue: string,
  imageUrl: string,
  env: Environment,
  envState: EnvironmentState
): Promise<string | EnvironmentState | EnvironmentState[]> => {
  console.log("Generate Steps function called");
  // console.log("Live image url:", imageUrl);

  const response = await sendEnvAndEnvStatesData("/api/generate_program", {
    text: inputValue,
    images: [imageUrl],
    env: env,
    envStates: [envState],
  }); // Include text, image, and stepData in the request payload

  console.log("Response from server:", response);
  return response;
};
