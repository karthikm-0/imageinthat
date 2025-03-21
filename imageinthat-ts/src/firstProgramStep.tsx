import { sendStepData } from "./FlaskApi";
import { EnvironmentAndEnvironmentStates } from "./interfaces";

export const firstProgramStep = async (
  image: string
): Promise<EnvironmentAndEnvironmentStates> => {
  const response = await sendStepData("/api/create_manual_step", {
    image,
    type: "url",
  });
  console.log("Response from server:", response);

  // Assuming the response already contains the correct envAndEnvStates structure
  const envAndEnvStates = response.envAndEnvStates;

  console.log("Environment:", envAndEnvStates.env);
  console.log("Environment States:", envAndEnvStates.envStates);

  return envAndEnvStates;
};
