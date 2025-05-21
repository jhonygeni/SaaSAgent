export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          created_at: string | null
          id: string
          is_completed: boolean | null
          location: string | null
          notes: string | null
          pet_id: string
          reason: string | null
          veterinarian: string | null
        }
        Insert: {
          appointment_date: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          location?: string | null
          notes?: string | null
          pet_id: string
          reason?: string | null
          veterinarian?: string | null
        }
        Update: {
          appointment_date?: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          location?: string | null
          notes?: string | null
          pet_id?: string
          reason?: string | null
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string
          event_type: string
          id: string
          pet_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          pet_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          pet_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_events_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_health_records: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          pet_id: string
          record_date: string
          veterinarian: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          pet_id: string
          record_date: string
          veterinarian?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          pet_id?: string
          record_date?: string
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_health_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_medications: {
        Row: {
          created_at: string | null
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          medication_name: string
          pet_id: string
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          medication_name: string
          pet_id: string
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          medication_name?: string
          pet_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_medications_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_vaccines: {
        Row: {
          created_at: string | null
          date_administered: string | null
          due_date: string | null
          id: string
          pet_id: string
          vaccine_name: string
        }
        Insert: {
          created_at?: string | null
          date_administered?: string | null
          due_date?: string | null
          id?: string
          pet_id: string
          vaccine_name: string
        }
        Update: {
          created_at?: string | null
          date_administered?: string | null
          due_date?: string | null
          id?: string
          pet_id?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_vaccines_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age: number | null
          breed: string | null
          created_at: string | null
          id: string
          medical_conditions: string[] | null
          name: string
          owner_id: string
          type: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          breed?: string | null
          created_at?: string | null
          id?: string
          medical_conditions?: string[] | null
          name: string
          owner_id: string
          type: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          breed?: string | null
          created_at?: string | null
          id?: string
          medical_conditions?: string[] | null
          name?: string
          owner_id?: string
          type?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          created_at: string | null
          credit_cost: number
          description: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          credit_cost: number
          description: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          credit_cost?: number
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          tool_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          tool_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          tool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          credits: number | null
          email: string
          id: string
          is_subscribed: boolean | null
          name: string | null
          phone: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits?: number | null
          email: string
          id: string
          is_subscribed?: boolean | null
          name?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number | null
          email?: string
          id?: string
          is_subscribed?: boolean | null
          name?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
