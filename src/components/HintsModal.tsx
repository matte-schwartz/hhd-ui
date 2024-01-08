import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import { useState } from "react";
import HintsAccordion from "./HintsAccordion";

function HintsModal() {
  const [open, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <>
      <Button onClick={onOpen}>More Info</Button>

      <Modal isOpen={open} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>More Information</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <HintsAccordion />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default HintsModal;
