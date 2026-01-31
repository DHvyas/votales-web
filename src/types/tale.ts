export interface Tale {
  id: string;
  content: string;
  title: string | null;
  authorName: string | null;
  isDeleted: boolean;
}

export interface Choice {
  id: string;
  taleId: string;
  title: string | null;
  previewText: string;
  votes: number;
  targetTaleId: string;
}

export interface TaleWithChoices {
  tale: Tale;
  choices: Choice[];
}
