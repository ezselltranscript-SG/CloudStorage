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
      folders: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          created_at: string
          user_id: string
          is_shared: boolean
          deleted_at: string | null
          original_parent_id: string | null
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          created_at?: string
          user_id?: string
          is_shared?: boolean
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          created_at?: string
          user_id?: string
          is_shared?: boolean
        }
      }
      files: {
        Row: {
          id: string
          name: string
          folder_id: string
          storage_path: string
          size: number
          mimetype: string
          created_at: string
          user_id: string
          is_shared: boolean
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          folder_id: string
          storage_path: string
          size?: number
          mimetype?: string
          created_at?: string
          user_id?: string
          is_shared?: boolean
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          folder_id?: string
          storage_path?: string
          size?: number
          mimetype?: string
          created_at?: string
          user_id?: string
          is_shared?: boolean
          deleted_at?: string | null
        }
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
  }
}
