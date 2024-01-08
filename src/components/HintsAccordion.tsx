import {
  Accordion,
  AccordionItem,
  AccordionButton,
  Box,
  AccordionIcon,
  AccordionPanel,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { selectHhdSettings } from "../redux-modules/hhdSlice";
import { FC } from "react";

type PropType = {
  settings: { [key: string]: any };
};

const SettingsAccordion: FC<PropType> = ({ settings }) => {
  return (
    <Accordion allowToggle allowMultiple>
      {Object.keys(settings).map((topLevelStr, idx) => {
        const { title, hint, children } = settings[topLevelStr];
        return (
          <AccordionItem key={idx}>
            <h2>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  {title}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              {hint}
              {Object.values(children).map((child, idx) => {
                if (child) {
                  return renderChild(child, idx);
                }
                return null;
              })}
            </AccordionPanel>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

function renderChild(child: any, key: number) {
  const { title, hint, children, modes } = child;

  return (
    <AccordionItem key={key}>
      <h2>
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            {title}
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel pb={4}>
        {hint}
        {children &&
          Object.values(children).map((child, idx) => {
            return renderChild(child, idx);
          })}
        {modes &&
          Object.values(modes).map((child, idx) => {
            return renderChild(child, idx);
          })}
      </AccordionPanel>
    </AccordionItem>
  );
}

const HintsAccordionContainer = () => {
  const settings = useSelector(selectHhdSettings);

  return (
    <>
      {Object.values(settings).map((s, idx) => {
        //@ts-ignore
        return <SettingsAccordion settings={s} key={idx} />;
      })}
    </>
  );
};

export default HintsAccordionContainer;