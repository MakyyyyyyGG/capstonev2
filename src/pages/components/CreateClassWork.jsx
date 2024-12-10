import React from "react";
import {
  Plus,
  LayoutGrid,
  Palette,
  Grid2x2,
  Grid2x2Plus,
  NotebookPen,
} from "lucide-react";
import { TbCards } from "react-icons/tb";
import { FaRegLightbulb } from "react-icons/fa";
import { LiaListOlSolid } from "react-icons/lia";
import PreviewFlashcard from "./PreviewFlashcard";
import PreviewDecisionMaker from "./PreviewDecisionMaker";
import PreviewSequenceGame from "./PreviewSequenceGame";
import PreviewThinkpicPlus from "./PreviewThinkpicPlus";
import PreviewColorGame from "./PreviewColorGame";
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { useRouter } from "next/router";

const CreateClassWork = ({ room_code }) => {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const educ = [
    {
      title: "Flashcard",
      preview: <PreviewFlashcard />,
      path: "create_flashcard",
      icon: <TbCards size={25} className="text-[#7C3AED] " />,
      iconBg: "bg-[#7C3AED]/10",
      description:
        "Tool used to teach the student to identify and remember the objects seen or used in the environment. for memory retention",
    },
  ];

  const games = [
    {
      title: "ThinkPic",
      path: "create_4pics1word",
      icon: <Grid2x2 size={25} className="text-[#7C3AED]" />,
      iconBg: "bg-[#7C3AED]/10",
      preview: <PreviewThinkpicPlus />,
      description:
        "Challenge students to guess the word that connects to the images. Test the students' problem solving skills and their vocabulary.",
    },
    {
      title: "ThinkPic+",
      path: "create_4pics1word_advanced",
      icon: <LayoutGrid size={25} className="text-[#7C3AED]" />,
      iconBg: "bg-[#7C3AED]/10",
      preview: <PreviewThinkpicPlus />,
      description:
        "Challenge students to guess the word using the images as the options. This will further test the student's skills in problem solving.",
    },
    {
      title: "Color Game",
      path: "create_color_game",
      icon: <Palette size={25} className="text-[#7C3AED]" />,
      iconBg: "bg-[#7C3AED]/10",
      preview: <PreviewColorGame />,
      description:
        "Enchance students' color recognition skills through identifying images that will match to a specific color.",
    },
    {
      title: "Sequence Game",
      path: "create_color_game_advanced",
      icon: <LiaListOlSolid size={25} className="text-[#7C3AED]" />,
      iconBg: "bg-[#7C3AED]/10",
      preview: <PreviewSequenceGame />,
      description:
        "Challenge students by asking them to identify and arrange the sequence of images in chronological order.",
    },
    {
      title: "Decision Maker",
      path: "create_decision_maker",
      icon: (
        <FaRegLightbulb size={25} className="text-[#7C3AED] -rotate-[15deg]" />
      ),
      iconBg: "bg-[#7C3AED]/10",
      preview: <PreviewDecisionMaker />,
      description:
        "Practice the students' critical thinking skills by identifying right and wrong actions to help proper decision making in real life.",
    },
    {
      title: "Assignment",
      path: "create_assignment",
      icon: <NotebookPen size={25} className="text-[#7C3AED]" />,
      iconBg: "bg-[#7C3AED]/10",
      description:
        "Create assignments to assess students' understanding and reinforce learning through structured tasks.",
    },
  ];

  return (
    <div>
      <Button
        color="secondary"
        startContent={<Plus size={20} />}
        radius="sm"
        onPress={onOpen}
      >
        Create
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        scrollBehavior="inside"
        size="5xl"
      >
        <ModalContent>
          <ModalHeader className="flex justify-center items-center">
            <h1 className="pt-6 pb-3 text-2xl font-bold text-left max-sm:text-xl">
              What would you like to create?
            </h1>
          </ModalHeader>
          <ModalBody className="pb-6">
            <h1 className="pt-3 text-lg font-bold text-left max-sm:text-md">
              Educational Materials
            </h1>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-2">
              {educ.map((game, index) => (
                <Card
                  isPressable
                  key={index}
                  radius="sm"
                  className="col-span-2 px-3 hover:bg-gray-200 flex items-center"
                  onClick={() =>
                    router.push(`/${game.path}?room_code=${room_code}`)
                  }
                >
                  {/* <Link
                                  href={`/${game.path}?room_code=${room_code}`}
                                  className="w-full h-full flex flex-col justify-center items-center"
                                > */}
                  <CardHeader className="flex gap-5 pt-5 items-center justify-start">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-[50px] h-[50px] p-1 rounded-md ${game.iconBg}`}
                        >
                          {game.icon}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold text-xl text-left">
                            {game.title}
                          </p>
                        </div>
                      </div>
                      <div className="ml-auto">{game.preview}</div>
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible pt-0 pb-5 text-left">
                    <p className="text-sm">{game.description}</p>
                  </CardBody>
                  {/* </Link> */}
                </Card>
              ))}
            </div>
            <h1 className="pt-3 text-lg font-bold text-left max-sm:text-md">
              Tasks
            </h1>
            <div className="grid grid-cols-4 gap-4 max-sm:grid-cols-2">
              {games.map((game, index) => (
                <Card
                  isPressable
                  key={index}
                  radius="sm"
                  className="col-span-2 px-3 hover:bg-gray-200 flex items-center"
                  onClick={() =>
                    router.push(`/${game.path}?room_code=${room_code}`)
                  }
                >
                  {/* <Link
                    href={`/${game.path}?room_code=${room_code}`}
                    className="w-full h-full flex flex-col justify-center items-center"
                  > */}
                  <CardHeader className="flex gap-5 pt-5 items-center justify-start">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-[50px] h-[50px] p-1 rounded-md ${game.iconBg}`}
                        >
                          {game.icon}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold text-xl text-left">
                            {game.title}
                          </p>
                        </div>
                      </div>
                      <div className="ml-auto">{game.preview}</div>
                    </div>
                  </CardHeader>
                  <CardBody className="overflow-visible pt-0 pb-5 text-left">
                    <p className="text-sm">{game.description}</p>
                  </CardBody>
                  {/* </Link> */}
                </Card>
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CreateClassWork;
