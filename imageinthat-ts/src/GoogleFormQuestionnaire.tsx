import React, { useState } from "react";
import { withGridItem } from "@hcikit/react";
import PropTypes from "prop-types";
import { useExperiment } from "@hcikit/react";

// TODO: THere are two ways to use the prefilled fields, either you want one from props, or you want to supply one directly... Or maybe just always from props? Either way the array is the wrong way to do it, it should be an object.

// TODO: multi page forms?

const GoogleFormQuestionnaire: React.FunctionComponent<{
  prefilledFields?: Record<string, string>;
  prefilledFieldsFromProps?: Record<string, string>;
  formId: string;
  sections: number;
}> = ({
  prefilledFields,
  prefilledFieldsFromProps,
  sections = 1,
  formId,
  ...props
}) => {
  const experiment = useExperiment();
  let src = `https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true`;

  const [timesLoaded, setTimesLoaded] = useState(0);
  console.log("Times loaded", timesLoaded);

  const extraProps = props as Record<string, string>;

  let urlString = "";

  if (prefilledFields) {
    urlString += Object.entries(prefilledFields)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
  }

  if (prefilledFieldsFromProps) {
    urlString += Object.entries(prefilledFieldsFromProps)
      .map(([key, prop]) => `${key}=${extraProps[prop]}`)
      .join("&");
  }

  if (urlString) {
    src = `${src}&${urlString}`;
  }

  function handleLoad() {
    console.log("loading ???", timesLoaded, sections);
    if (timesLoaded >= sections) {
      experiment.advance();
    } else {
      setTimesLoaded((times) => times + 1);
    }
  }
  return (
    <iframe
      style={{
        width: "100%",
        height: "100vh",
      }}
      // ref='iframe'
      title="Questionnaire"
      src={src}
      frameBorder="0"
      marginHeight={0}
      marginWidth={0}
      onLoad={handleLoad}
    >
      Loading...
    </iframe>
  );
};

GoogleFormQuestionnaire.propTypes = {
  formId: PropTypes.string.isRequired,
  prefilledFields: PropTypes.objectOf(PropTypes.string.isRequired),
  prefilledFieldsFromProps: PropTypes.objectOf(PropTypes.string.isRequired),
};

export default withGridItem(GoogleFormQuestionnaire);
