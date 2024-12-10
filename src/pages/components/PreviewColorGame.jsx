import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { Play } from "lucide-react";

const PreviewColorGame = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const scrollBehavior = "inside";

  return (
    <div>
      <Button onPress={onOpen} radius="sm" color="secondary" className="">
        <Play size={18} />
        Preview
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="3xl"
        scrollBehavior={scrollBehavior}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Color Game Sample Preview</ModalHeader>
              <ModalBody>
                <video
                  src="/games_preview/colorgame_prev.mp4"
                  autoPlay
                  muted
                  loop
                  style={{ width: "100%" }}
                  className="rounded-md"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default PreviewColorGame;
