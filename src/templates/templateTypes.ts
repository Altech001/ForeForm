import React from "react";

export type DocxTemplateDefinition = {
  id: string;
  name: string;
  description: string;
  accent: string;
  surface: string;
  border: string;
  text: string;
  previewTitle: string;
  previewSubtitle: string;
  tags: string[];
  Preview: () => React.ReactElement;
};
