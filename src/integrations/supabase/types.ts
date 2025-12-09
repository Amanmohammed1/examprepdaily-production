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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          category: Database["public"]["Enums"]["content_category"] | null
          content: string | null
          exam_tags: Database["public"]["Enums"]["exam_type"][] | null
          fetched_at: string
          id: string
          is_processed: boolean | null
          key_points: string[] | null
          original_url: string | null
          processed_at: string | null
          published_at: string | null
          source_id: string | null
          source_name: string
          summary: string | null
          title: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["content_category"] | null
          content?: string | null
          exam_tags?: Database["public"]["Enums"]["exam_type"][] | null
          fetched_at?: string
          id?: string
          is_processed?: boolean | null
          key_points?: string[] | null
          original_url?: string | null
          processed_at?: string | null
          published_at?: string | null
          source_id?: string | null
          source_name: string
          summary?: string | null
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["content_category"] | null
          content?: string | null
          exam_tags?: Database["public"]["Enums"]["exam_type"][] | null
          fetched_at?: string
          id?: string
          is_processed?: boolean | null
          key_points?: string[] | null
          original_url?: string | null
          processed_at?: string | null
          published_at?: string | null
          source_id?: string | null
          source_name?: string
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sources: {
        Row: {
          category: Database["public"]["Enums"]["content_category"]
          created_at: string
          id: string
          is_active: boolean | null
          last_fetched_at: string | null
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          url: string
        }
        Insert: {
          category: Database["public"]["Enums"]["content_category"]
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          name: string
          source_type?: Database["public"]["Enums"]["source_type"]
          url: string
        }
        Update: {
          category?: Database["public"]["Enums"]["content_category"]
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_fetched_at?: string | null
          name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          url?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          article_count: number | null
          email: string
          id: string
          sent_at: string
          status: string | null
          subject: string
          subscriber_id: string | null
        }
        Insert: {
          article_count?: number | null
          email: string
          id?: string
          sent_at?: string
          status?: string | null
          subject: string
          subscriber_id?: string | null
        }
        Update: {
          article_count?: number | null
          email?: string
          id?: string
          sent_at?: string
          status?: string | null
          subject?: string
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          code: Database["public"]["Enums"]["exam_type"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          related_categories:
          | Database["public"]["Enums"]["content_category"][]
          | null
        }
        Insert: {
          code: Database["public"]["Enums"]["exam_type"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          related_categories?:
          | Database["public"]["Enums"]["content_category"][]
          | null
        }
        Update: {
          code?: Database["public"]["Enums"]["exam_type"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          related_categories?:
          | Database["public"]["Enums"]["content_category"][]
          | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          selected_exams: Database["public"]["Enums"]["exam_type"][]
          subscribed_at: string
          unsubscribed_at: string | null
          verification_token: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          selected_exams?: Database["public"]["Enums"]["exam_type"][]
          subscribed_at?: string
          unsubscribed_at?: string | null
          verification_token?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          selected_exams?: Database["public"]["Enums"]["exam_type"][]
          subscribed_at?: string
          unsubscribed_at?: string | null
          verification_token?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_category:
      | "rbi_circulars"
      | "government_schemes"
      | "economy"
      | "banking"
      | "finance"
      | "current_affairs"
      | "international"
      | "science_tech"
      | "environment"
      | "sports"
      | "awards"
      | "other"
      exam_type:
      | "rbi_grade_b"
      | "sebi_grade_a"
      | "nabard_grade_a"
      | "nabard_grade_b"
      | "upsc_cse"
      | "upsc_ies"
      | "ssc_cgl"
      | "ibps_po"
      | "ibps_clerk"
      | "lic_aao"
      | "current_affairs"
      | "other"
      source_type: "rss" | "scrape" | "api"
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
      content_category: [
        "rbi_circulars",
        "government_schemes",
        "economy",
        "banking",
        "finance",
        "current_affairs",
        "international",
        "science_tech",
        "environment",
        "sports",
        "awards",
        "other",
      ],
      exam_type: [
        "rbi_grade_b",
        "sebi_grade_a",
        "nabard_grade_a",
        "nabard_grade_b",
        "upsc_cse",
        "upsc_ies",
        "ssc_cgl",
        "ibps_po",
        "ibps_clerk",
        "lic_aao",
        "other",
      ],
      source_type: ["rss", "scrape", "api"],
    },
  },
} as const
