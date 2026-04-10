import AlberTemplate from "./AlberTemplate";
import AniTemplate from "./AniTemplate";
import BenicoTemplate from "./BenicoTemplate";
import FilbertTemplate from "./FilbertTemplate";
import GracTemplate from "./GracTemplate";
import LilTemplate from "./LilTemplate";

export const docxTemplates = [
  AlberTemplate,
  AniTemplate,
  BenicoTemplate,
  FilbertTemplate,
  GracTemplate,
  LilTemplate,
];

export function getDocxTemplate(templateId?: string) {
  return docxTemplates.find((template) => template.id === templateId) || AlberTemplate;
}
