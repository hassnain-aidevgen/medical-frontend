"use client";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import axios from "axios";
import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint: string;
}

const BASE_API_URL = "https://medical-backend-loj4.onrender.com/api/test"

export default function FlashcardRecord() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      const response = await axios.get(`${BASE_API_URL}/flashcards?numFlashcards=5`);
      setFlashcards(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(`Failed to load flashcards: ${error.response?.data?.message || error.message}`);
      } else {
        toast.error("Failed to load flashcards");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this flashcard?")) return;

    try {
      await axios.delete(`${BASE_API_URL}/flashcards/${id}`);
      setFlashcards((prevFlashcards) => prevFlashcards.filter((card) => card.id !== id));
      toast.success("Flashcard deleted successfully");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(`Failed to delete flashcard: ${error.response?.data?.message || error.message}`);
      } else {
        toast.error("Failed to delete flashcard");
      }
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flashcards.map((flashcard) => (
            <div key={flashcard.id} className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium">{flashcard.question}</h3>
              <div className="space-y-2">
                <p>
                  <strong>Answer:</strong> {flashcard.answer}
                </p>
                <p>
                  <strong>Hint:</strong> {flashcard.hint}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(flashcard.id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
}
