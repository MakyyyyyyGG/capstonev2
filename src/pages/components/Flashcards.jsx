import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
  Image,
} from "@nextui-org/react";
import { Button } from "@nextui-org/react";

const Flashcards = ({ flashcards }) => {
  return (
    <div>
      <h1>Flashcard Type Game</h1>
      <div className="flex flex-wrap gap-4">
        {flashcards.map((flashcard) => (
          <div key={flashcard.flashcard_id} className="w-1/2">
            <Card className="w-full">
              <CardBody className="flex flex-col gap-4">
                {flashcard.image && (
                  <img
                    src={flashcard.image}
                    alt={flashcard.term}
                    className="w-full h-auto"
                  />
                )}
                <h2>Term: {flashcard.term}</h2>
                <p>Description: {flashcard.description}</p>
                {flashcard.audio && (
                  <audio src={flashcard.audio} controls className="w-full" />
                )}
                <Button>Edit</Button>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Flashcards;
