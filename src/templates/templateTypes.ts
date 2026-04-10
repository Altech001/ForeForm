import React from "react";

export type FormContext = {
  title?: string;
  description?: string;
  branding?: {
    organization?: string;
    research_title?: string;
    appendix_label?: string;
    consent_text?: string;
    ethics_statement?: string;
    logo_url?: string;
    [key: string]: any;
  };
  questions?: any[];
};

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
  Preview: (props?: { form?: FormContext }) => React.ReactElement;
};
