import React from "react";
import {
  Book,
  Plus,
  LayoutGrid,
  Grid2X2Plus,
  Palette,
  Info,
} from "lucide-react";
import { TbCards } from "react-icons/tb";
import { FaRegLightbulb } from "react-icons/fa";
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
      <Button isIconOnly color="secondary" onPress={onOpen}>
        <Plus />
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        scrollBehavior="inside"
        size="xl"
        classNames={{
          body: "pb-6 px-8 max-sm:p-4 max-sm:pb-4",
          header: "text-[#F3F3F3] text-3xl p-8 max-sm:p-4 max-sm:text-xl",
          footer: "px-8 pb-8 max-sm:px-4 max-sm:pb-4",
          base: "bg-[#7469B6] text-[#a8b0d3]",
          closeButton:
            "text-[#fff] text-lg hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex justify-center items-center">
            <h1 className="pt-6 pb-3 text-2xl font-bold text-center max-sm:text-xl">
              What would you like to create?
            </h1>
          </ModalHeader>
          <ModalBody className="pb-6">
            <div className="grid grid-cols-4 gap-4 max-sm:grid-cols-2 ">
              <Card
                className="relative col-span-2 hover:bg-gray-200"
                isPressable
              >
                <Link
                  href={`/create_flashcard?room_code=${room_code}`}
                  className="w-full py-4 justify-center "
                >
                  <CardHeader className="pb-0 pt-2 px-4 flex gap-5 items-center justify-center ">
                    <div className="flex items-center justify-center w-[80px] h-[80px] bg-[#7469B6] rounded-full">
                      <TbCards className="text-5xl text-white" />
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible mt-2 py-2 justify-center text-center">
                    <p className="uppercase font-bold text-lg">Flashcard</p>
                  </CardBody>
                </Link>
              </Card>

              <Card className="col-span-2 hover:bg-gray-200" isPressable>
                <Link
                  href={`/create_4pics1word?room_code=${room_code}`}
                  className="w-full py-4 justify-center "
                >
                  <CardHeader className="pb-0 pt-2 px-4 flex gap-5 items-center justify-center ">
                    <div className="flex items-center justify-center w-[80px] h-[80px] bg-[#7469B6] rounded-full">
                      <LayoutGrid className="w-9 h-9 text-white" />
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible mt-2 py-2 justify-center text-center">
                    <p className="uppercase font-bold text-lg">4 Pics 1 Word</p>
                  </CardBody>
                </Link>
              </Card>
              <Card className="col-span-2 hover:bg-gray-200" isPressable>
                <Link
                  href={`/create_4pics1word_advanced?room_code=${room_code}`}
                  className="w-full py-4 justify-center"
                >
                  <CardHeader className="pb-0 pt-2 px-4 flex gap-5 items-center justify-center ">
                    <div className="relative flex items-center justify-center w-[80px] h-[80px] bg-[#7469B6] rounded-full">
                      <LayoutGrid className="w-9 h-9 text-white" />
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible mt-2 py-2 justify-center text-center">
                    <p className="uppercase font-bold text-lg">
                      4 Pics 1 Word +
                    </p>
                  </CardBody>
                </Link>
              </Card>

              <Card className="col-span-2 hover:bg-gray-200" isPressable>
                <Link
                  href={`/create_color_game?room_code=${room_code}`}
                  className="w-full py-4 justify-center"
                >
                  <CardHeader className="pb-0 pt-2 px-4 flex gap-5 items-center justify-center ">
                    <div className="flex items-center justify-center w-[80px] h-[80px] bg-[#7469B6] rounded-full">
                      <Palette className="w-10 h-10 text-white" />
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible mt-2 py-2 justify-center text-center">
                    <p className="uppercase font-bold text-lg">Color Game</p>
                  </CardBody>
                </Link>
              </Card>
              <Card className="col-span-2 hover:bg-gray-200" isPressable>
                <Link
                  href={`/create_color_game_advanced?room_code=${room_code}`}
                  className="w-full py-4 justify-center"
                >
                  <CardHeader className="pb-0 pt-2 px-4 flex gap-5 items-center justify-center ">
                    <div className="flex items-center justify-center w-[80px] h-[80px] bg-[#7469B6] rounded-full">
                      <Palette className="w-10 h-10 text-white" />
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible mt-2 py-2 justify-center text-center">
                    <p className="uppercase font-bold text-lg">Color Game +</p>
                  </CardBody>
                </Link>
              </Card>
              <Card className="col-span-2 hover:bg-gray-200" isPressable>
                <Link
                  href={`/create_decision_maker?room_code=${room_code}`}
                  className="w-full py-4 justify-center"
                >
                  <CardHeader className="pb-0 pt-2 px-4 flex gap-5 items-center justify-center ">
                    <div className="flex items-center justify-center w-[80px] h-[80px] bg-[#7469B6] rounded-full">
                      <FaRegLightbulb className="text-4xl text-white -rotate-[15deg]" />
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible mt-2 py-2 justify-center text-center">
                    <p className="uppercase font-bold text-lg">
                      Decision Maker
                    </p>
                    {/* Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Iure, libero? */}
                  </CardBody>
                </Link>
              </Card>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CreateClassWork;
