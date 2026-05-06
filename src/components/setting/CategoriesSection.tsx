import { useState } from "react";
import { CategoryList } from "./category/CategoryList";
import { CategoryDetail } from "./category/CategoryDetail";
import { type QuoteCategory } from "@/hooks/useSelectionTreeNodes";

export function CategoriesSection() {
  const [active, setActive] = useState<QuoteCategory>("MATERIAL");

  return (
    <div className="flex h-full">
      <CategoryList selectedCategory={active} onSelect={setActive} />
      <div className="flex-1 overflow-hidden">
        <CategoryDetail category={active} />
      </div>
    </div>
  );
}
