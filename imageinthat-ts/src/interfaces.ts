import { cloneDeep, map, merge, partition } from "lodash";

// Define the State type
export type State = {
  category: string;
  state: string;
  unique_name: string;
};

// Define the StateCombination type
export type StateCombination = {
  image: string;
  state: State[];
};

// export type StepInterface = {
//   step_annotation: string;
//   // TODO: consider renaming to objects or object_masks not masks
//   masks: Array<{
//     name: string;
//     image: string;
//     height: number;
//     width: number;
//     x: number;
//     y: number;
//     category: string;
//     class: string;
//     isReceptacle: boolean;
//     state: string;
//     box: [number, number, number, number];
//     // state: string; // discrete values like on off.
//   }>;

//   boxes: Array<{
//     name: string;
//     height: number;
//     width: number;
//     x: number;
//     y: number;
//     category: string;
//     class: string;
//     isReceptacle: boolean;
//     state: string;
//     possibleStates: string[];
//     box: [number, number, number, number];
//   }>;

//   image_id: string;
//   imageObjectURL: string;
//   caption?: string;
// };

export type TextStepInterface = {
  text: string;
};

type BoundingBox = [number, number, number, number];

export type Change = Partial<EnvironmentState>;

type FullObject = Environment["objects"][keyof Environment["objects"]] &
  EnvironmentState["objects"][keyof EnvironmentState["objects"]] & {
    name: keyof Environment["objects"];
  };

export function getFullObject(
  name: keyof Environment["objects"],
  env: Environment,
  envState: EnvironmentState
): FullObject {
  return { name, ...envState.objects[name], ...env.objects[name] };
}

export function getEnvironmentStateFromChanges(
  initialState: EnvironmentState,
  changes: Change[]
): EnvironmentState {
  let state = initialState;

  for (const change of changes) {
    state = merge(state, change);
  }

  return state;
}

// { bowl: {x: 10, y:10}}
// [{ name: bowl, x: 10, y:10}]

export type EnvironmentAndEnvironmentStates = {
  env: Environment;
  envStates: EnvironmentState[];
};

export type EnvironmentState = {
  fixtures: Record<string, string>; //  {"cabinet:"open",stove:"on"}
  objectOrder: Array<string>; // []
  objects: Record<
    string,
    {
      x: number;
      y: number;
      hidden?: boolean; // Add hidden property
    }
  >;
  caption?: string;
};

export type Environment = {
  backgrounds: Record<string, string>; // {"cabinet:open,stove:on" : "myimage.jpg"}

  fixtures: Record<
    string,
    {
      x: number;
      y: number;
      width: number;
      height: number;
      possibleStates: string[];
      boundingBox: BoundingBox;
      class: string;
      category: string;
    }
  >; // {stove : {x, y, possibleStates}}

  objects: Record<
    string,
    {
      class: string;
      category: string;
      isReceptacle: boolean;
      boundingBox: BoundingBox;
      width: number;
      height: number;
      image: string;
    }
  >; // {bowl : {}}

  possibleManipulations?: Array<{
    unique_name: string;
    places: string[];
  }>; // {unique_name: "bowl", places: ["stove", "cabinet"]}
};

// export const stepInterfaceToEnvironmentAndEnvironmentState = (
//   step: StepInterface,
//   stateCombinations: StateCombination[],
//   currentState: StateCombination
// ): {
//   envAndEnvStates: EnvironmentAndEnvironmentStates;
// } => {
//   step = cloneDeep(step);

//   const [, masks] = partition(step.masks, {
//     name: "background",
//   });

//   const env = {
//     fixtures: {},
//     objects: {},
//     backgrounds: {},
//   } as Environment;

//   const envState = {
//     caption: step.caption,
//     objectOrder: map(masks, "name"),
//     fixtures: {},
//     objects: {},
//   } as EnvironmentState;

//   for (const mask of masks) {
//     env.objects[mask.name] = {
//       class: mask.class,
//       boundingBox: mask.box,
//       category: mask.category,
//       isReceptacle: mask.isReceptacle,
//       width: mask.width,
//       height: mask.height,
//       image: mask.image,
//     };

//     envState.objects[mask.name] = { x: mask.x, y: mask.y };
//   }

//   for (const fixture of step.boxes) {
//     if (fixture.state !== "") {
//       // Ignore fixtures with empty string as state
//       envState.fixtures[fixture.name] = fixture.state;
//     }

//     env.fixtures[fixture.name] = {
//       class: fixture.class,
//       boundingBox: fixture.box,
//       category: fixture.category,
//       width: fixture.width,
//       height: fixture.height,
//       x: fixture.x,
//       y: fixture.y,
//       possibleStates: fixture.possibleStates,
//     };
//   }

//   // Update env backgrounds with state combinations
//   for (const combination of stateCombinations) {
//     const key = combination.state
//       .map((s) => `${s.unique_name}_${s.category}_${s.state}`)
//       .join(",");
//     env.backgrounds[key] = combination.image;
//   }

//   // Update envState fixtures to reflect the current state from the server
//   // NOTE: It ignores fixtures with empty string as state
//   for (const state of currentState.state) {
//     if (state.state !== "") {
//       const key = state.unique_name;
//       envState.fixtures[key] = state.state;
//     }
//   }
//   // Return env and envstates together as a new type (EnvironmentAndEnvironmentStates)
//   return { envAndEnvStates: { env, envStates: [envState] } };
// };

export function getBackground(env: Environment, envState: EnvironmentState) {
  const fixtureFound = fixturesToString(env, envState);
  // console.log("Fixture found", fixtureFound);
  return env.backgrounds[fixtureFound];
}

export const fixturesToString = (
  env: Environment,
  envState: EnvironmentState
) => {
  // Iterate over all fixtures in the envState
  const fixtureStrings = Object.entries(envState.fixtures)
    .map(([key, value]) => {
      // Check if the fixture exists in the environment
      const fixture = env.fixtures[key];
      if (!fixture) {
        //console.warn(`Fixture ${key} not found in env`);
        return null; // Skip this entry if the fixture is not found
      }

      // Prepare the fixture string
      return `${key}_${fixture.category}_${value}`;
    })
    .filter(Boolean); // Remove any null entries
  //.sort(); // Sort the entries to ensure consistent ordering

  // Join all formatted strings with commas
  // console.log("Fixture strings", fixtureStrings);
  return fixtureStrings.join(",");
};

// type EnvironmentDescriptor = {
//   allMasksAndStates: Array<{
//     maskName: string;
//     possibleStates: Record<string, string>;
//   }>;
// };

// const exampleInterface: EnvironmentDescriptor = {
//   allMasksAndStates: [
//     {
//       maskName: "coffeemachine",
//       possibleStates: { on: "on.jpg", off: "off.jpg" },
//     },
//   ],
//   environmentStates : {

//   }
// };

// You would need to represent cabinets and containers as affecting the space somehow as well.

// Environment = you need an image for every single combination of all of the CustomStateSet. So cupboard 1 open, 2 closed, etc. etc.
// {cupboard1: "open", cupboard2: "closed"}
// {cupboard1: "open", cupboard2: "open"}
// {cupboard1: "closed", cupboard2: "closed"}
// {cupboard1: "closed", cupboard2: "open"}

// api call to get the possible tasks is the same
// make an api call that takes an image and calls chatgpt
