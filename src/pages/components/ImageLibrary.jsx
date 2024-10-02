import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
  Image,
  Checkbox,
  Card,
} from "@nextui-org/react";
import { Library } from "lucide-react";

const ImageLibraryModal = ({ onImageSelect, initialSelectedImages }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedImages, setSelectedImages] = useState(
    initialSelectedImages || []
  );

  const displayImages = [
    { id: 1, image: "/color_game/images/blue-book.png" },
    { id: 2, image: "/color_game/images/blue-cap.png" },
    { id: 3, image: "/color_game/images/blue-cup.png" },
    { id: 4, image: "/color_game/images/red-ball.png" },
    { id: 5, image: "/color_game/images/red-strawberry.png" },
    { id: 6, image: "/color_game/images/red-watermelon.png" },
    { id: 7, image: "/color_game/images/yellow-bee.png" },
    { id: 8, image: "/color_game/images/yellow-duck.png" },
    { id: 9, image: "/color_game/images/yellow-star.png" },
    { id: 10, image: "/color_game/images/yellow-star.png" },
    { id: 11, image: "/color_game/images/yellow-star.png" },
  ];

  const handleImageSelect = (imageId) => {
    setSelectedImages((prev) => {
      if (prev.includes(imageId)) {
        return prev.filter((id) => id !== imageId);
      } else if (prev.length < 3) {
        return [...prev, imageId];
      }
      return prev;
    });
  };

  const handleInsertImages = () => {
    const selectedImageUrls = selectedImages.map(
      (id) => displayImages.find((img) => img.id === id).image
    );
    onImageSelect(selectedImageUrls); // Call the prop callback with selected images
    setSelectedImages([]);
    onOpenChange(); // Close the modal
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="full">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Image Library</ModalHeader>
        <ModalBody>
          <h2 className="mb-4 text-lg font-semibold">Select 3 Images</h2>
          <div className="grid grid-cols-3 gap-4">
            {displayImages.map((item) => (
              <div key={item.id} className="p-2 border rounded-md relative">
                <Checkbox
                  isSelected={selectedImages.includes(item.id)}
                  onChange={() => handleImageSelect(item.id)}
                  isDisabled={
                    selectedImages.length >= 3 &&
                    !selectedImages.includes(item.id)
                  }
                />
                <Image
                  src={item.image}
                  alt={`Image ${item.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onPress={handleInsertImages}
            isDisabled={selectedImages.length !== 3}
          >
            Insert
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImageLibraryModal;
