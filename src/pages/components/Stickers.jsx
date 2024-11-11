import React, { useState } from "react";
import {
  Tabs,
  Tab,
  Input,
  Card,
  CardBody,
  Image,
  Chip,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import toast, { Toaster } from "react-hot-toast";
import { Star, Medal, Crown, Sparkles, Search, Coins } from "lucide-react"; // Importing icons
import useUserStore from "../api/coins_exp/useUserStore";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useSession } from "next-auth/react";
const calculateLevel = (totalExp) => {
  let level = 0;
  let remainingExp = totalExp;
  let currentLevelRequirement = 100; // Starting exp requirement

  while (remainingExp >= currentLevelRequirement) {
    remainingExp -= currentLevelRequirement;
    level++;
    currentLevelRequirement = Math.floor(100 * Math.pow(1.5, level)); // Increase by 50% each level
  }

  return {
    level,
    currentExp: remainingExp,
    nextLevelExp: currentLevelRequirement,
  };
};

const Stickers = ({ stickers = [], ownedStickers = [], onRefetch }) => {
  const { updateCoinsExp } = useUserStore(); // Get the update function from the store
  const exp = useUserStore((state) => state.exp);
  const coins = useUserStore((state) => state.coins);
  const { level } = calculateLevel(exp);
  // console.log("stickers:", stickers);
  // console.log("ownedStickers:", ownedStickers);
  const [activeTab, setActiveTab] = useState("common");
  const [searchQuery, setSearchQuery] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: session } = useSession();

  const handleClaimOrBuy = async (sticker) => {
    //if not enough coins
    if (coins < sticker.coin_cost) {
      toast.error("Not enough coins", {
        duration: 5000,
      });
      return;
    }
    const isOwned = ownedStickers.some(
      (owned) => owned.sticker_id === sticker.sticker_id
    );
    const isClaimable = level >= sticker.level_requirement;

    if (!isOwned && isClaimable) {
      try {
        const response = await fetch("/api/stickers/claim_or_buy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account_id: session.user.id,
            sticker_id: sticker.sticker_id,
            coin_cost: sticker.coin_cost,
          }),
        });

        if (response.ok) {
          // Update the user's coins and experience
          const data = await response.json();
          updateCoinsExp(data.newCoins, null);
          toast.success("Sticker claimed or purchased successfully", {
            duration: 5000,
          });
          onRefetch();
        } else {
          console.error("Failed to claim or buy sticker");
          toast.error("Failed to claim or buy sticker", {
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error claiming or buying sticker:", error);
        toast.error("Error claiming or buying sticker", {
          duration: 5000,
        });
      }
    }
  };

  const renderContent = () => {
    const stickerData = {
      common: {
        label: "Common",
        color: "default",
        icon: <Star />,
      },
      rare: { label: "Rare", color: "primary", icon: <Medal /> },
      epic: { label: "Epic", color: "success", icon: <Crown /> },
      legendary: { label: "Legendary", color: "warning", icon: <Sparkles /> },
    };

    const filteredStickers = stickers.filter(
      (sticker) =>
        sticker.type === activeTab &&
        sticker.name.includes(searchQuery.toLowerCase())
    );

    return (
      <div className="grid grid-cols-3 gap-4">
        <Toaster />
        {filteredStickers.map((sticker) => {
          const isOwned = ownedStickers.some(
            (owned) => owned.sticker_id === sticker.sticker_id
          );
          const isClaimable = level >= sticker.level_requirement;
          const { label, color } = stickerData[sticker.type];

          return (
            <Card
              key={sticker.sticker_id}
              className={`${
                sticker.type === "common"
                  ? "bg-gray-200"
                  : sticker.type === "rare"
                  ? "bg-blue-200"
                  : sticker.type === "epic"
                  ? "bg-green-200"
                  : "bg-yellow-200"
              }`}
            >
              <CardBody className="w-full flex flex-col gap-2 justify-center">
                <Image
                  src={`${sticker.url}.png`}
                  alt="Sticker"
                  style={{
                    width: "100%",
                    height: "auto",
                    aspectRatio: "1 / 1",
                    // border: "1px solid #7469B6",
                    // objectFit: "cover",
                  }}
                />
                {sticker.coin_cost === null && (
                  <h1>Reach Level {sticker.level_requirement} to unlock</h1>
                )}
                <span className="text-xl font-bold">
                  {sticker.name} Sticker
                </span>
                <div className="flex justify-between w-full items-center">
                  <Chip variant="flat" color={color}>
                    {label}
                  </Chip>
                  {sticker.coin_cost > 0 ? (
                    <>
                      <span className="text-sm text-gray-500"></span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          {isOwned ? (
                            <Button isDisabled>Owned</Button>
                          ) : (
                            <Button isDisabled={!isClaimable}>
                              <Coins size={16} /> {sticker.coin_cost}
                            </Button>
                          )}
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            Confirm Purchase
                          </AlertDialogHeader>
                          <p>
                            Are you sure you want to purchase this sticker for{" "}
                            {sticker.coin_cost} coins?
                          </p>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={onClose}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleClaimOrBuy(sticker)}
                            >
                              Confirm
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button isDisabled={isOwned || !isClaimable}>
                          {isOwned ? "Owned" : "Claim"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>Confirm Claim</AlertDialogHeader>
                        <p>Are you sure you want to claim this sticker?</p>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={onClose}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleClaimOrBuy(sticker)}
                          >
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Button onClick={onOpen}>Open Stickers</Button>
      <Modal isOpen={isOpen} onClose={onClose} size="5xl">
        <ModalContent>
          <ModalHeader>Stickers</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                clearable
                startContent={<Search size={22} color="#6B7280" />}
                type="text"
                placeholder="Search Stickers"
                radius="sm"
                size="lg"
                color="secondary"
                variant="bordered"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                classNames={{
                  label: "text-white",
                  inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                }}
              />
              <Tabs
                color="secondary"
                radius="sm"
                variant="bordered"
                classNames={{
                  tabList: "border-gray-300 border bg-white rounded-lg",
                }}
                size="lg"
                aria-label="Sticker Types"
                fullWidth
                selectedKey={activeTab}
                onSelectionChange={setActiveTab}
              >
                <Tab
                  id="common"
                  key="common"
                  title={
                    <div className="flex items-center space-x-2">
                      <Star className="max-sm:w-4 max-sm:h-4" />
                      <span>Common</span>
                    </div>
                  }
                />
                <Tab
                  id="rare"
                  key="rare"
                  title={
                    <div className="flex items-center space-x-2">
                      <Medal className="max-sm:w-4 max-sm:h-4" />
                      <span>Rare</span>
                    </div>
                  }
                />
                <Tab
                  id="epic"
                  key="epic"
                  title={
                    <div className="flex items-center space-x-2">
                      <Crown className="max-sm:w-4 max-sm:h-4" />
                      <span>Epic</span>
                    </div>
                  }
                />
                <Tab
                  id="legendary"
                  key="legendary"
                  title={
                    <div className="flex items-center space-x-2">
                      <Sparkles className="max-sm:w-4 max-sm:h-4" />
                      <span>Legendary</span>
                    </div>
                  }
                />
              </Tabs>
              <div className="content">{renderContent()}</div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Stickers;
