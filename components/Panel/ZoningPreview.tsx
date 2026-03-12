"use client";

import type { ZoningType } from "@/lib/types";
import ZoningHome from "../Zonings/ZoningHome";
import ZoningListing from "../Zonings/ZoningListing";
import ZoningDetail from "../Zonings/ZoningDetail";
import ZoningForm from "../Zonings/ZoningForm";
import ZoningLanding from "../Zonings/ZoningLanding";
import ZoningQuiz from "../Zonings/ZoningQuiz";
import ZoningSearch from "../Zonings/ZoningSearch";

const ZONING_MAP: Record<ZoningType, React.ComponentType<{ accent: string }>> = {
  home: ZoningHome,
  listing: ZoningListing,
  detail: ZoningDetail,
  form: ZoningForm,
  landing: ZoningLanding,
  quiz: ZoningQuiz,
  search: ZoningSearch,
};

interface ZoningPreviewProps {
  type: ZoningType;
  accent: string;
}

export default function ZoningPreview({ type, accent }: ZoningPreviewProps) {
  const Component = ZONING_MAP[type];
  if (!Component) return null;
  return <Component accent={accent} />;
}
