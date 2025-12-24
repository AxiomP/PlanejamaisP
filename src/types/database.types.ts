export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      institutions: {
        Row: {
          id: string
          name: string
          cnpj: string | null
          contact_email: string | null
          contact_phone: string | null
          address: Json | null
          subscription_tier: string
          total_credits: number
          license_count: number
          active_licenses: number
          settings: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          cnpj?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: Json | null
          subscription_tier?: string
          total_credits?: number
          license_count?: number
          active_licenses?: number
          settings?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          cnpj?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: Json | null
          subscription_tier?: string
          total_credits?: number
          license_count?: number
          active_licenses?: number
          settings?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'teacher' | 'admin' | 'institution'
          institution_id: string | null
          credits: number
          subscription_tier: 'free' | 'premium' | 'institution'
          subscription_status: 'active' | 'cancelled' | 'expired'
          subscription_expires_at: string | null
          onboarding_completed: boolean
          preferences: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'teacher' | 'admin' | 'institution'
          institution_id?: string | null
          credits?: number
          subscription_tier?: 'free' | 'premium' | 'institution'
          subscription_status?: 'active' | 'cancelled' | 'expired'
          subscription_expires_at?: string | null
          onboarding_completed?: boolean
          preferences?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'teacher' | 'admin' | 'institution'
          institution_id?: string | null
          credits?: number
          subscription_tier?: 'free' | 'premium' | 'institution'
          subscription_status?: 'active' | 'cancelled' | 'expired'
          subscription_expires_at?: string | null
          onboarding_completed?: boolean
          preferences?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          tool_type: string
          title: string | null
          input_data: Json
          output_data: Json | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          credits_used: number
          processing_time_ms: number | null
          error_message: string | null
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tool_type: string
          title?: string | null
          input_data: Json
          output_data?: Json | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          credits_used?: number
          processing_time_ms?: number | null
          error_message?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tool_type?: string
          title?: string | null
          input_data?: Json
          output_data?: Json | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          credits_used?: number
          processing_time_ms?: number | null
          error_message?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          generation_id: string | null
          transaction_type: 'purchase' | 'subscription_renewal' | 'generation_usage' | 'refund' | 'admin_adjustment' | 'promotional'
          amount: number
          balance_after: number
          description: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          generation_id?: string | null
          transaction_type: 'purchase' | 'subscription_renewal' | 'generation_usage' | 'refund' | 'admin_adjustment' | 'promotional'
          amount: number
          balance_after: number
          description?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          generation_id?: string | null
          transaction_type?: 'purchase' | 'subscription_renewal' | 'generation_usage' | 'refund' | 'admin_adjustment' | 'promotional'
          amount?: number
          balance_after?: number
          description?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      chatbot_conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          message_count: number
          last_message_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          message_count?: number
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          message_count?: number
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      chatbot_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          attachments: Json | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          attachments?: Json | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          attachments?: Json | null
          metadata?: Json
          created_at?: string
        }
      }
      generation_templates: {
        Row: {
          id: string
          user_id: string
          tool_type: string
          name: string
          description: string | null
          template_data: Json
          is_public: boolean
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_type: string
          name: string
          description?: string | null
          template_data: Json
          is_public?: boolean
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tool_type?: string
          name?: string
          description?: string | null
          template_data?: Json
          is_public?: boolean
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      bncc_codes: {
        Row: {
          id: string
          code: string
          description: string
          subject: string
          grade_level: string
          competence_area: string | null
          full_description: string | null
          examples: Json | null
          related_codes: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description: string
          subject: string
          grade_level: string
          competence_area?: string | null
          full_description?: string | null
          examples?: Json | null
          related_codes?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string
          subject?: string
          grade_level?: string
          competence_area?: string | null
          full_description?: string | null
          examples?: Json | null
          related_codes?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_credits: {
        Args: {
          p_user_id: string
          p_generation_id: string
          p_amount: number
        }
        Returns: boolean
      }
      add_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_transaction_type?: string
          p_description?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types for convenience
export type User = Tables<'users'>
export type Institution = Tables<'institutions'>
export type Generation = Tables<'generations'>
export type CreditTransaction = Tables<'credit_transactions'>
export type ChatbotConversation = Tables<'chatbot_conversations'>
export type ChatbotMessage = Tables<'chatbot_messages'>
export type GenerationTemplate = Tables<'generation_templates'>
export type BNCCCode = Tables<'bncc_codes'>
