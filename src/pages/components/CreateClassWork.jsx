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
      <Button
        isIconOnly
        className="bg-[#7469B6] text-white border-0"
        onPress={onOpen}
      >
        <Plus />
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        scrollBehavior="inside"
        size="3xl"
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
                className="col-span-2 px-3 hover:bg-gray-200 flex items-center"
                isPressable
              >
                <Link
                  href={`/create_flashcard?room_code=${room_code}`}
                  className="w-full h-full flex flex-col justify-center items-center"
                >
                  <CardHeader className="flex gap-5 pt-5 items-center justify-start ">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-[30px] h-[30px] bg-[#7469B6] p-1 rounded-full">
                        <TbCards className="text-xl text-white" />
                      </div>
                      <p className="font-bold text-xl ml-3">Flashcard</p>
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible pt-0 pb-5 text-left">
                    <p className="text-sm">
                      Tool used to teach the student to identify and remember
                      the objects seen or used in the environement. for memory
                      retention
                    </p>
                  </CardBody>
                </Link>
              </Card>

              <Card
                className="col-span-2 px-3 hover:bg-gray-200 flex items-center"
                isPressable
              >
                <Link
                  href={`/create_4pics1word?room_code=${room_code}`}
                  className="w-full h-full flex flex-col justify-center items-center"
                >
                  <CardHeader className="flex gap-5 pt-5 items-center justify-start ">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-[30px] h-[30px] bg-[#7469B6] p-1 rounded-full">
                        <LayoutGrid className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-bold text-xl ml-3">ThinkPic</p>
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible pt-0 pb-5 text-left">
                    <p className="text-sm">
                      Challenge students to guess the word that connects to the
                      images. Test the students' problem solving skills and
                      their vocabulary.
                    </p>
                  </CardBody>
                </Link>
              </Card>
              <Card
                className="col-span-2 px-3 hover:bg-gray-200 flex items-center"
                isPressable
              >
                <Link
                  href={`/create_4pics1word_advanced?room_code=${room_code}`}
                  className="w-full h-full flex flex-col justify-center items-center"
                >
                  <CardHeader className="flex gap-5 pt-5 items-center justify-start">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-[30px] h-[30px] bg-[#f31260] p-1 rounded-full">
                        <LayoutGrid className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-bold text-xl ml-3">ThinkPic+</p>
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible pt-0 pb-5 text-left">
                    <p className="text-sm">
                      Challenge students to guess the word using the images as
                      the options. This will further test the student's skills
                      in problem solving.
                    </p>
                  </CardBody>
                </Link>
              </Card>

              <Card
                className="col-span-2 px-3 hover:bg-gray-200 flex items-center"
                isPressable
              >
                <Link
                  href={`/create_color_game?room_code=${room_code}`}
                  className="w-full h-full flex flex-col justify-center items-center"
                >
                  <CardHeader className="flex gap-5 pt-5 items-center justify-start">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-[30px] h-[30px] bg-[#7469B6] p-1 rounded-full">
                        <Palette className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-bold text-xl ml-3">Color Game</p>
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible pt-0 pb-5 text-left">
                    <p className="text-sm">
                      Enchance students' color recognition skills through
                      identifying images that will match to a specific color.
                    </p>
                  </CardBody>
                </Link>
              </Card>
              <Card
                className="col-span-2 px-3 hover:bg-gray-200 flex items-center"
                isPressable
              >
                <Link
                  href={`/create_color_game_advanced?room_code=${room_code}`}
                  className="w-full h-full flex flex-col justify-center items-center"
                >
                  <CardHeader className="flex gap-5 pt-5 items-center justify-start">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-[30px] h-[30px] bg-[#f31260] p-1 rounded-full">
                        <Palette className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-bold text-xl ml-3">Color Game+</p>
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible pt-0 pb-5 text-left">
                    <p className="text-sm">
                      Enchance students' color recognition skills through
                      identifying images that will match to a specific color.
                    </p>
                  </CardBody>
                </Link>
              </Card>
              <Card
                className="col-span-2 px-3 hover:bg-gray-200 flex items-center"
                isPressable
              >
                <Link
                  href={`/create_decision_maker?room_code=${room_code}`}
                  className="w-full h-full flex flex-col justify-center items-center"
                >
                  <CardHeader className="flex gap-5 pt-5 items-center justify-start">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-[30px] h-[30px] bg-[#7469B6] p-1 rounded-full">
                        <FaRegLightbulb className="text-lg text-white -rotate-[15deg]" />
                      </div>
                      <p className="font-bold text-xl ml-3">Decision Maker</p>
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible pt-0 pb-5 text-left">
                    <p className="text-sm">
                      Practice the students' critical thinking skills by
                      identifying right and wrong actions to help proper
                      decision making in real life.z
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
