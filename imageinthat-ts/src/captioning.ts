import { EnvironmentAndEnvironmentStates } from "./interfaces"; // Adjust the import path as needed
import { sendEnvAndEnvStatesData } from "./FlaskApi"; // Adjust the import path as needed
import { generateCombinedImage } from "./imageUtils"; // Adjust the import path as needed

export async function getCaptionForStates(
  envAndEnvStates: EnvironmentAndEnvironmentStates
): Promise<string> {
  const { env, envStates } = envAndEnvStates;

  if (envStates.length !== 2) {
    throw new Error("The envStates array must contain exactly two states.");
  }

  // Generate images
  const generatedImages = await Promise.all(
    envStates.map((state) => generateCombinedImage(env, state))
  );

  try {
    const endpoint = "/api/generate_caption"; // Define the endpoint for generating captions
    const data = {
      env: env,
      envStates: envStates,
      images: generatedImages,
    };

    const response = await sendEnvAndEnvStatesData(endpoint, data);

    // Ensure the response is a string
    if (typeof response === "string") {
      return response;
    } else {
      throw new Error("Expected a string response but received an object.");
    }
  } catch (error) {
    console.error("Error getting caption:", error);
    throw error;
  }
}
