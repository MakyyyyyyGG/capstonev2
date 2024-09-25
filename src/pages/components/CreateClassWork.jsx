import React from "react";
import { Book } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardBody,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";

const CreateClassWork = ({ room_code }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  return (
    <div>
      <Button color="secondary" onPress={onOpen}>
        Create +
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl">
        <ModalContent>
          <ModalHeader>What would you like to create?</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2  gap-4">
              <Link href={`/create_flashcard?room_code=${room_code}`}>
                <Card className="py-4 hover:bg-gray-200" isPressable>
                  <CardHeader className="pb-0 pt-2 px-4 flex gap-5 items-center">
                    <Book />
                    <p className="uppercase font-bold">Flashcard</p>
                  </CardHeader>
                  <CardBody className="overflow-visible py-2">
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Iure, libero?
                  </CardBody>
                </Card>
              </Link>
              <Link href={`/create_4pics1word?room_code=${room_code}`}>
                <Card className="py-4 hover:bg-gray-200" isPressable>
                  <CardHeader className="pb-0 pt-2 px-4 flex gap-5 items-center">
                    <Book />
                    <p className="uppercase font-bold">4 Pics One Word </p>
                  </CardHeader>
                  <CardBody className="overflow-visible py-2">
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Iure, libero?
                  </CardBody>
                </Card>
              </Link>
              <Link href={`/create_4pics1word_advanced?room_code=${room_code}`}>
                <Card className="py-4 hover:bg-gray-200" isPressable>
                  <CardHeader className="pb-0 pt-2 px-4 flex gap-5 items-center">
                    <Book />
                    <p className="uppercase font-bold">
                      4 Pics One Word Advanced
                    </p>
                  </CardHeader>
                  <CardBody className="overflow-visible py-2">
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Iure, libero?
                  </CardBody>
                </Card>
              </Link>
              <Card className="py-4 hover:bg-gray-200" isPressable>
                <CardHeader className="pb-0 pt-2 px-4 flex gap-5 items-center">
                  <Book />
                  <p className="uppercase font-bold">Discussion</p>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                  Iure, libero?
                </CardBody>
              </Card>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CreateClassWork;
