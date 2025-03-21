// useHighestDimensions.ts
import { useEffect, useState } from "react";
import { highestDimensions } from "./config";

export function useHighestDimensions() {
  const [dims, setDims] = useState({
    width: highestDimensions.HIGHEST_WIDTH,
    height: highestDimensions.HIGHEST_HEIGHT,
  });

  useEffect(() => {
    const update = () =>
      setDims({
        width: highestDimensions.HIGHEST_WIDTH,
        height: highestDimensions.HIGHEST_HEIGHT,
      });

    highestDimensions.subscribe(update);
    return () => {}; // could add unsubscribe later if needed
  }, []);

  return dims;
}