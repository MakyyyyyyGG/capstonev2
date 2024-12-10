import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";

const PreviewThinkpic = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const scrollBehavior = "inside";

  return (
    <div>
      <Button onPress={onOpen} radius="sm" color="secondary" className="">
        Preview
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="xl"
        scrollBehavior={scrollBehavior}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Thinkpic Sample Preview</ModalHeader>
              <ModalBody>
                <video
                  src="/games_preview/thinkpic_prev.mp4"
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

export default PreviewThinkpic;
