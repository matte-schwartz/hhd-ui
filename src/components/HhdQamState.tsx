import { Box, Card } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { useShouldRenderParent } from "../hooks/conditionalRender";
import { useSetHhdState } from "../hooks/controller";
import {
  SettingsType,
  selectHhdSettings,
  selectHhdSettingsState,
  selectSectionNames,
} from "../redux-modules/hhdSlice";
import ErrorBoundary from "./ErrorBoundary";
import HhdComponent, { renderChild } from "./HhdComponent";
import { CONTENT_WIDTH } from "./theme";

const HhdQamState = () => {
  const state = useSelector(selectHhdSettingsState);
  const settings: { [key: string]: { [key: string]: SettingsType } } =
    useSelector(selectHhdSettings);
  const sectionNames = useSelector(selectSectionNames);

  const setState = useSetHhdState();

  const shouldRenderParent = useShouldRenderParent();

  return (
    <Card width={CONTENT_WIDTH}>
      {Object.entries(settings).map(([topLevelStr, plugins], topIdx) => {
        if (!shouldRenderParent(plugins)) {
          return null;
        }
        return (
          <Box key={topIdx}>
            {Object.keys(plugins).map((pluginName, idx) => {
              const plugin = plugins[pluginName] as SettingsType;
              const statePath = `${topLevelStr}.${pluginName}`;

              return (
                <ErrorBoundary key={`${statePath}${topIdx}${idx}`}>
                  <HhdComponent
                    {...plugin}
                    state={state}
                    childName={pluginName}
                    renderChild={renderChild}
                    statePath={statePath}
                    updateState={setState}
                  />
                </ErrorBoundary>
              );
            })}
          </Box>
        );
      })}
    </Card>
  );
};

export default HhdQamState;