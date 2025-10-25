import React from "react";

import { linkifyText } from "../utils/linkify";

import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  created_at: string;
  file_url?: string;
  file_name?: string;
}

interface ChatCardProps {
  message: ChatMessage;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString("ru-RU");
  } catch {
    return dateStr;
  }
}

export default function ChatCard({ message }: ChatCardProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {message.sender} • {formatDate(message.created_at)}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm">
          {message.file_url ? (
            <div>
              <p>{linkifyText(message.content)}</p>
              <a
                href={message.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-blue-600 hover:text-blue-800"
              >
                📎 {message.file_name || "Файл"}
              </a>
            </div>
          ) : (
            <p>{linkifyText(message.content)}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
