export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          attributes: Json | null
          created_at: string | null
          customer_type: string
          id: string
          name: string
          name_kana: string | null
          rank: string | null
          remarks: string | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string | null
          customer_type?: string
          id?: string
          name: string
          name_kana?: string | null
          rank?: string | null
          remarks?: string | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string | null
          customer_type?: string
          id?: string
          name?: string
          name_kana?: string | null
          rank?: string | null
          remarks?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      formula_templates: {
        Row: {
          builtin_key: string | null
          category: Database["public"]["Enums"]["quote_category"] | null
          created_at: string | null
          description: string | null
          formula: string
          id: string
          is_builtin: boolean | null
          kind: Database["public"]["Enums"]["formula_kind"]
          name: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          builtin_key?: string | null
          category?: Database["public"]["Enums"]["quote_category"] | null
          created_at?: string | null
          description?: string | null
          formula: string
          id?: string
          is_builtin?: boolean | null
          kind: Database["public"]["Enums"]["formula_kind"]
          name: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          builtin_key?: string | null
          category?: Database["public"]["Enums"]["quote_category"] | null
          created_at?: string | null
          description?: string | null
          formula?: string
          id?: string
          is_builtin?: boolean | null
          kind?: Database["public"]["Enums"]["formula_kind"]
          name?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      items: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          drawing_url: string | null
          id: string
          item_code: string
          name: string
          remarks: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          drawing_url?: string | null
          id?: string
          item_code: string
          name: string
          remarks?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          drawing_url?: string | null
          id?: string
          item_code?: string
          name?: string
          remarks?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      lookup_rows: {
        Row: {
          conditions: Json
          created_at: string | null
          id: string
          interpolation:
            | Database["public"]["Enums"]["interpolation_type"]
            | null
          return_value: number
          return_value_max: number | null
          version_id: string
        }
        Insert: {
          conditions: Json
          created_at?: string | null
          id?: string
          interpolation?:
            | Database["public"]["Enums"]["interpolation_type"]
            | null
          return_value: number
          return_value_max?: number | null
          version_id: string
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          id?: string
          interpolation?:
            | Database["public"]["Enums"]["interpolation_type"]
            | null
          return_value?: number
          return_value_max?: number | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lookup_rows_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "lookup_table_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      lookup_table_versions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          lookup_table_id: string
          published_at: string | null
          status: Database["public"]["Enums"]["lookup_version_status"]
          updated_at: string | null
          version_number: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          lookup_table_id: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["lookup_version_status"]
          updated_at?: string | null
          version_number: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          lookup_table_id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["lookup_version_status"]
          updated_at?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "lookup_table_versions_lookup_table_id_fkey"
            columns: ["lookup_table_id"]
            isOneToOne: false
            referencedRelation: "lookup_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      lookup_tables: {
        Row: {
          axes: Json
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          axes?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          axes?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          attributes: Json | null
          category: string | null
          created_at: string | null
          id: string
          material_code: string
          name: string
          remarks: string | null
          unit_id: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          category?: string | null
          created_at?: string | null
          id?: string
          material_code: string
          name: string
          remarks?: string | null
          unit_id?: string | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          category?: string | null
          created_at?: string | null
          id?: string
          material_code?: string
          name?: string
          remarks?: string | null
          unit_id?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      node_master_values: {
        Row: {
          created_at: string | null
          id: string
          node_master_id: string
          updated_at: string | null
          values: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          node_master_id: string
          updated_at?: string | null
          values: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          node_master_id?: string
          updated_at?: string | null
          values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "node_master_values_node_master_id_fkey"
            columns: ["node_master_id"]
            isOneToOne: false
            referencedRelation: "node_masters"
            referencedColumns: ["id"]
          },
        ]
      }
      node_masters: {
        Row: {
          attribute_schema: Json | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          attribute_schema?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          attribute_schema?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      processes: {
        Row: {
          attributes: Json | null
          category: Database["public"]["Enums"]["process_category"]
          cost_type: Database["public"]["Enums"]["process_cost_type"]
          created_at: string | null
          fixed_cost: number | null
          hourly_rate: number | null
          id: string
          name: string
          process_code: string
          remarks: string | null
          setup_time_default: number | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          category: Database["public"]["Enums"]["process_category"]
          cost_type?: Database["public"]["Enums"]["process_cost_type"]
          created_at?: string | null
          fixed_cost?: number | null
          hourly_rate?: number | null
          id?: string
          name: string
          process_code: string
          remarks?: string | null
          setup_time_default?: number | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          category?: Database["public"]["Enums"]["process_category"]
          cost_type?: Database["public"]["Enums"]["process_cost_type"]
          created_at?: string | null
          fixed_cost?: number | null
          hourly_rate?: number | null
          id?: string
          name?: string
          process_code?: string
          remarks?: string | null
          setup_time_default?: number | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quote_category_totals: {
        Row: {
          adjustment: number
          category: Database["public"]["Enums"]["quote_category"]
          computed_value: number | null
          final_value: number | null
          g_params: Json | null
          g_template_id: string | null
          id: string
          multiplier: number
          override_value: number | null
          quote_lot_id: string
        }
        Insert: {
          adjustment?: number
          category: Database["public"]["Enums"]["quote_category"]
          computed_value?: number | null
          final_value?: number | null
          g_params?: Json | null
          g_template_id?: string | null
          id?: string
          multiplier?: number
          override_value?: number | null
          quote_lot_id: string
        }
        Update: {
          adjustment?: number
          category?: Database["public"]["Enums"]["quote_category"]
          computed_value?: number | null
          final_value?: number | null
          g_params?: Json | null
          g_template_id?: string | null
          id?: string
          multiplier?: number
          override_value?: number | null
          quote_lot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_category_totals_g_template_id_fkey"
            columns: ["g_template_id"]
            isOneToOne: false
            referencedRelation: "formula_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_category_totals_quote_lot_id_fkey"
            columns: ["quote_lot_id"]
            isOneToOne: false
            referencedRelation: "quote_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_details: {
        Row: {
          adjustment: number
          category: Database["public"]["Enums"]["quote_category"]
          computed_value: number | null
          created_at: string | null
          final_value: number | null
          formula_template_id: string | null
          id: string
          leaf_node_id: string | null
          lookup_versions_used: Json | null
          multiplier: number
          override_value: number | null
          quote_lot_id: string
          remarks: string | null
          selection_path: string[] | null
          sort_order: number | null
          transport_cost: number | null
          updated_at: string | null
          variable_values: Json | null
        }
        Insert: {
          adjustment?: number
          category: Database["public"]["Enums"]["quote_category"]
          computed_value?: number | null
          created_at?: string | null
          final_value?: number | null
          formula_template_id?: string | null
          id?: string
          leaf_node_id?: string | null
          lookup_versions_used?: Json | null
          multiplier?: number
          override_value?: number | null
          quote_lot_id: string
          remarks?: string | null
          selection_path?: string[] | null
          sort_order?: number | null
          transport_cost?: number | null
          updated_at?: string | null
          variable_values?: Json | null
        }
        Update: {
          adjustment?: number
          category?: Database["public"]["Enums"]["quote_category"]
          computed_value?: number | null
          created_at?: string | null
          final_value?: number | null
          formula_template_id?: string | null
          id?: string
          leaf_node_id?: string | null
          lookup_versions_used?: Json | null
          multiplier?: number
          override_value?: number | null
          quote_lot_id?: string
          remarks?: string | null
          selection_path?: string[] | null
          sort_order?: number | null
          transport_cost?: number | null
          updated_at?: string | null
          variable_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_details_formula_template_id_fkey"
            columns: ["formula_template_id"]
            isOneToOne: false
            referencedRelation: "formula_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_details_leaf_node_id_fkey"
            columns: ["leaf_node_id"]
            isOneToOne: false
            referencedRelation: "selection_tree_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_details_quote_lot_id_fkey"
            columns: ["quote_lot_id"]
            isOneToOne: false
            referencedRelation: "quote_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_formula_settings: {
        Row: {
          category_margins: Json | null
          enabled_categories: Json | null
          id: string
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          rounding_digits: number
          rounding_method: Database["public"]["Enums"]["rounding_method"]
          total_margin: number | null
          total_margin_table_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_margins?: Json | null
          enabled_categories?: Json | null
          id?: string
          margin_mode?: Database["public"]["Enums"]["margin_mode"]
          rounding_digits?: number
          rounding_method?: Database["public"]["Enums"]["rounding_method"]
          total_margin?: number | null
          total_margin_table_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_margins?: Json | null
          enabled_categories?: Json | null
          id?: string
          margin_mode?: Database["public"]["Enums"]["margin_mode"]
          rounding_digits?: number
          rounding_method?: Database["public"]["Enums"]["rounding_method"]
          total_margin?: number | null
          total_margin_table_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_formula_settings_total_margin_table_id_fkey"
            columns: ["total_margin_table_id"]
            isOneToOne: false
            referencedRelation: "lookup_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_lots: {
        Row: {
          computed_total: number | null
          created_at: string | null
          final_total: number | null
          id: string
          is_default: boolean | null
          quantity: number
          quote_id: string
          sort_order: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          computed_total?: number | null
          created_at?: string | null
          final_total?: number | null
          id?: string
          is_default?: boolean | null
          quantity: number
          quote_id: string
          sort_order?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          computed_total?: number | null
          created_at?: string | null
          final_total?: number | null
          id?: string
          is_default?: boolean | null
          quantity?: number
          quote_id?: string
          sort_order?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_lots_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          computed_total: number | null
          created_at: string | null
          created_by: string | null
          final_total: number | null
          id: string
          item_id: string
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          quote_number: string
          remarks: string | null
          rounding_digits: number
          rounding_method: Database["public"]["Enums"]["rounding_method"]
          total_adjustment: number
          total_margin: number | null
          total_margin_table_id: string | null
          total_multiplier: number
          total_override: number | null
          updated_at: string | null
          version: number
        }
        Insert: {
          computed_total?: number | null
          created_at?: string | null
          created_by?: string | null
          final_total?: number | null
          id?: string
          item_id: string
          margin_mode: Database["public"]["Enums"]["margin_mode"]
          quote_number: string
          remarks?: string | null
          rounding_digits?: number
          rounding_method?: Database["public"]["Enums"]["rounding_method"]
          total_adjustment?: number
          total_margin?: number | null
          total_margin_table_id?: string | null
          total_multiplier?: number
          total_override?: number | null
          updated_at?: string | null
          version?: number
        }
        Update: {
          computed_total?: number | null
          created_at?: string | null
          created_by?: string | null
          final_total?: number | null
          id?: string
          item_id?: string
          margin_mode?: Database["public"]["Enums"]["margin_mode"]
          quote_number?: string
          remarks?: string | null
          rounding_digits?: number
          rounding_method?: Database["public"]["Enums"]["rounding_method"]
          total_adjustment?: number
          total_margin?: number | null
          total_margin_table_id?: string | null
          total_multiplier?: number
          total_override?: number | null
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_quotes_margin_table"
            columns: ["total_margin_table_id"]
            isOneToOne: false
            referencedRelation: "lookup_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      selection_tree_nodes: {
        Row: {
          category: Database["public"]["Enums"]["quote_category"]
          created_at: string | null
          fixed_variables: Json | null
          formula_template_id: string | null
          id: string
          label: string
          master_entity: string | null
          master_id: string | null
          node_master_value_id: string | null
          parent_id: string | null
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["quote_category"]
          created_at?: string | null
          fixed_variables?: Json | null
          formula_template_id?: string | null
          id?: string
          label: string
          master_entity?: string | null
          master_id?: string | null
          node_master_value_id?: string | null
          parent_id?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["quote_category"]
          created_at?: string | null
          fixed_variables?: Json | null
          formula_template_id?: string | null
          id?: string
          label?: string
          master_entity?: string | null
          master_id?: string | null
          node_master_value_id?: string | null
          parent_id?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "selection_tree_nodes_formula_template_id_fkey"
            columns: ["formula_template_id"]
            isOneToOne: false
            referencedRelation: "formula_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selection_tree_nodes_node_master_value_id_fkey"
            columns: ["node_master_value_id"]
            isOneToOne: false
            referencedRelation: "node_master_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selection_tree_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "selection_tree_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          code: string
          created_at: string | null
          dimension: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          dimension?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          dimension?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      variable_definitions: {
        Row: {
          code: string
          created_at: string | null
          default_value: number | null
          description: string | null
          id: string
          label: string
          lookup_table_id: string | null
          options: Json | null
          required: boolean
          source: Database["public"]["Enums"]["variable_source"]
          source_entity: string | null
          source_field: string | null
          type: Database["public"]["Enums"]["variable_type"]
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          default_value?: number | null
          description?: string | null
          id?: string
          label: string
          lookup_table_id?: string | null
          options?: Json | null
          required?: boolean
          source: Database["public"]["Enums"]["variable_source"]
          source_entity?: string | null
          source_field?: string | null
          type: Database["public"]["Enums"]["variable_type"]
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          default_value?: number | null
          description?: string | null
          id?: string
          label?: string
          lookup_table_id?: string | null
          options?: Json | null
          required?: boolean
          source?: Database["public"]["Enums"]["variable_source"]
          source_entity?: string | null
          source_field?: string | null
          type?: Database["public"]["Enums"]["variable_type"]
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_var_def_lookup"
            columns: ["lookup_table_id"]
            isOneToOne: false
            referencedRelation: "lookup_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variable_definitions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      formula_kind: "F" | "G" | "H"
      interpolation_type: "CONSTANT" | "LINEAR"
      lookup_match_type: "EXACT" | "RANGE" | "PREFIX"
      lookup_version_status: "ACTIVE" | "ARCHIVED"
      margin_mode: "CATEGORY" | "TOTAL" | "LOOKUP"
      process_category: "IN_HOUSE" | "OUTSOURCE" | "BOTH"
      process_cost_type: "HOURLY" | "FIXED" | "UNIT"
      quote_category:
        | "MATERIAL"
        | "IN_HOUSE"
        | "OUTSOURCE"
        | "PURCHASE"
        | "EXPENSE"
      rounding_method: "FLOOR" | "CEIL" | "ROUND"
      variable_source: "MANUAL" | "MASTER" | "LOOKUP" | "PATH"
      variable_type: "NUMBER" | "STRING" | "BOOLEAN" | "SELECT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      formula_kind: ["F", "G", "H"],
      interpolation_type: ["CONSTANT", "LINEAR"],
      lookup_match_type: ["EXACT", "RANGE", "PREFIX"],
      lookup_version_status: ["ACTIVE", "ARCHIVED"],
      margin_mode: ["CATEGORY", "TOTAL", "LOOKUP"],
      process_category: ["IN_HOUSE", "OUTSOURCE", "BOTH"],
      process_cost_type: ["HOURLY", "FIXED", "UNIT"],
      quote_category: [
        "MATERIAL",
        "IN_HOUSE",
        "OUTSOURCE",
        "PURCHASE",
        "EXPENSE",
      ],
      rounding_method: ["FLOOR", "CEIL", "ROUND"],
      variable_source: ["MANUAL", "MASTER", "LOOKUP", "PATH"],
      variable_type: ["NUMBER", "STRING", "BOOLEAN", "SELECT"],
    },
  },
} as const
