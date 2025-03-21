import { useEffect } from "react";

// TODO: create a devmode prop to ignore these things.
export const PreventReload: React.FC = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      window.onbeforeunload = function () {
        return "Are you sure you want to leave the page?";
      };
    }
    return () => {
      window.onbeforeunload = null;
    };
  }, []);

  return null;
};
