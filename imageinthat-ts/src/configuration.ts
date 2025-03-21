export const configuration = {
  tasks: ["WizardProgress"],
  children: [
    {
      task: "Timeline",
      children: [{ isExperimentEnabled: false, taskName: "demo" }],
    },
  ],
};
