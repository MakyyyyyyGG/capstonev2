import React from "react";
import {
  Modal,
  Button,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";

const ImagesModal = ({ onImageSelect, images }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleAction = (onClose, imageData) => {
    // Call the parent's callback to send the image data
    console.log("imageData:", imageData);
    onImageSelect(imageData);
    // Close the modal
    onClose();
  };

  return (
    <div>
      <Button onPress={onOpen}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="full"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Image Library
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1 max-md:grid-cols-2">
                  {images && images.length > 0 ? (
                    images.map((image) => (
                      <div
                        key={image.id}
                        className="flex flex-col items-center"
                      >
                        <img
                          src={image.image}
                          alt={image.id}
                          className="h-24 w-24 object-cover rounded-lg"
                        />
                        <Button
                          color="primary"
                          onPress={() => handleAction(onClose, image.image)}
                        >
                          Select
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p>No images found.</p>
                  )}
                </div>
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

export default ImagesModal;
