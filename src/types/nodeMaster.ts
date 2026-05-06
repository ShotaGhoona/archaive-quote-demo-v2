import { z } from "zod";

export const ATTRIBUTE_TYPES = ["STRING", "NUMBER", "BOOLEAN", "SELECT"] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export const attributeDefinitionSchema = z.object({
  key: z.string().min(1, "キーは必須です"),
  label: z.string().min(1, "ラベルは必須です"),
  type: z.enum(ATTRIBUTE_TYPES),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

export type AttributeDefinition = z.infer<typeof attributeDefinitionSchema>;

export const attributeSchemaSchema = z.array(attributeDefinitionSchema);
export type AttributeSchema = z.infer<typeof attributeSchemaSchema>;

/** title 属性は固定（編集・削除不可） */
export const TITLE_ATTRIBUTE: AttributeDefinition = {
  key: "title",
  label: "タイトル",
  type: "STRING",
  required: true,
};

export type NodeMasterValueData = Record<string, string | number | boolean | null>;
