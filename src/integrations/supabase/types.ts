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
      absences: {
        Row: {
          created_at: string
          date: string
          excused: boolean
          id: string
          periods: number[]
          reason: string | null
          school_id: string
          student_id: string
          teacher_id: string | null
          type: Database["public"]["Enums"]["absence_type"]
        }
        Insert: {
          created_at?: string
          date: string
          excused?: boolean
          id?: string
          periods?: number[]
          reason?: string | null
          school_id: string
          student_id: string
          teacher_id?: string | null
          type?: Database["public"]["Enums"]["absence_type"]
        }
        Update: {
          created_at?: string
          date?: string
          excused?: boolean
          id?: string
          periods?: number[]
          reason?: string | null
          school_id?: string
          student_id?: string
          teacher_id?: string | null
          type?: Database["public"]["Enums"]["absence_type"]
        }
        Relationships: [
          {
            foreignKeyName: "absences_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          body: string
          course_id: string | null
          created_at: string
          id: string
          pinned: boolean
          priority: Database["public"]["Enums"]["priority_level"]
          scheduled_at: string | null
          school_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string
          course_id?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          priority?: Database["public"]["Enums"]["priority_level"]
          scheduled_at?: string | null
          school_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          course_id?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          priority?: Database["public"]["Enums"]["priority_level"]
          scheduled_at?: string | null
          school_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff_json: Json
          id: string
          school_id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff_json?: Json
          id?: string
          school_id: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff_json?: Json
          id?: string
          school_id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          school_id: string
          title: string | null
          type: Database["public"]["Enums"]["conversation_type"]
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          school_id: string
          title?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          school_id?: string
          title?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      course_members: {
        Row: {
          course_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_members_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          color_hex: string
          created_at: string
          grade_level: string | null
          id: string
          name: string
          school_id: string
          subject: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          color_hex?: string
          created_at?: string
          grade_level?: string | null
          id?: string
          name: string
          school_id: string
          subject?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          color_hex?: string
          created_at?: string
          grade_level?: string | null
          id?: string
          name?: string
          school_id?: string
          subject?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string
          end_at: string
          id: string
          school_id: string
          start_at: string
          target_ids_json: Json
          target_scope: Database["public"]["Enums"]["event_scope"]
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          end_at: string
          id?: string
          school_id: string
          start_at: string
          target_ids_json?: Json
          target_scope?: Database["public"]["Enums"]["event_scope"]
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          end_at?: string
          id?: string
          school_id?: string
          start_at?: string
          target_ids_json?: Json
          target_scope?: Database["public"]["Enums"]["event_scope"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          conversation_id: string | null
          course_id: string | null
          created_at: string
          encrypted: boolean
          id: string
          mime_type: string | null
          name: string
          school_id: string
          size: number
          storage_path: string
          uploader_id: string
        }
        Insert: {
          conversation_id?: string | null
          course_id?: string | null
          created_at?: string
          encrypted?: boolean
          id?: string
          mime_type?: string | null
          name: string
          school_id: string
          size?: number
          storage_path: string
          uploader_id: string
        }
        Update: {
          conversation_id?: string | null
          course_id?: string | null
          created_at?: string
          encrypted?: boolean
          id?: string
          mime_type?: string | null
          name?: string
          school_id?: string
          size?: number
          storage_path?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_categories: {
        Row: {
          course_id: string
          created_at: string
          id: string
          name: string
          weight: number
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          name: string
          weight?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          name?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grade_categories_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          category: string
          course_id: string
          created_at: string
          id: string
          note: string | null
          student_id: string
          teacher_id: string
          updated_at: string
          value: number
          weight: number
        }
        Insert: {
          category?: string
          course_id: string
          created_at?: string
          id?: string
          note?: string | null
          student_id: string
          teacher_id: string
          updated_at?: string
          value: number
          weight?: number
        }
        Update: {
          category?: string
          course_id?: string
          created_at?: string
          id?: string
          note?: string | null
          student_id?: string
          teacher_id?: string
          updated_at?: string
          value?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grades_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          author_id: string
          course_id: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          school_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          course_id: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          school_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          course_id?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          school_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_status: {
        Row: {
          homework_id: string
          id: string
          status: Database["public"]["Enums"]["homework_state"]
          student_id: string
          updated_at: string
        }
        Insert: {
          homework_id: string
          id?: string
          status?: Database["public"]["Enums"]["homework_state"]
          student_id: string
          updated_at?: string
        }
        Update: {
          homework_id?: string
          id?: string
          status?: Database["public"]["Enums"]["homework_state"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_status_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_status_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body_encrypted: string
          conversation_id: string
          created_at: string
          id: string
          iv: string | null
          sender_id: string
        }
        Insert: {
          body_encrypted: string
          conversation_id: string
          created_at?: string
          id?: string
          iv?: string | null
          sender_id: string
        }
        Update: {
          body_encrypted?: string
          conversation_id?: string
          created_at?: string
          id?: string
          iv?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_child: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          parent_id: string
          student_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          parent_id: string
          student_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_child_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_child_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          poll_id: string
          selected_options_json: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          poll_id: string
          selected_options_json?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          poll_id?: string
          selected_options_json?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          anonymous: boolean
          course_id: string
          created_at: string
          creator_id: string
          ends_at: string | null
          id: string
          multi_choice: boolean
          options_json: Json
          question: string
        }
        Insert: {
          anonymous?: boolean
          course_id: string
          created_at?: string
          creator_id: string
          ends_at?: string | null
          id?: string
          multi_choice?: boolean
          options_json?: Json
          question: string
        }
        Update: {
          anonymous?: boolean
          course_id?: string
          created_at?: string
          creator_id?: string
          ends_at?: string | null
          id?: string
          multi_choice?: boolean
          options_json?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          color_hex: string
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          color_hex?: string
          created_at?: string
          email: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          color_hex?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          school_id: string
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          school_id: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          school_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          name: string
          settings_json: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          name: string
          settings_json?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
          settings_json?: Json
          updated_at?: string
        }
        Relationships: []
      }
      timetable_entries: {
        Row: {
          course_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          room: string | null
          school_id: string
          start_time: string
          teacher_id: string | null
          week_type: Database["public"]["Enums"]["week_type"]
        }
        Insert: {
          course_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          room?: string | null
          school_id: string
          start_time: string
          teacher_id?: string | null
          week_type?: Database["public"]["Enums"]["week_type"]
        }
        Update: {
          course_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          room?: string | null
          school_id?: string
          start_time?: string
          teacher_id?: string | null
          week_type?: Database["public"]["Enums"]["week_type"]
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_substitutions: {
        Row: {
          created_at: string
          date: string
          id: string
          new_room: string | null
          note: string | null
          replacement_teacher_id: string | null
          timetable_entry_id: string
          type: Database["public"]["Enums"]["substitution_type"]
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          new_room?: string | null
          note?: string | null
          replacement_teacher_id?: string | null
          timetable_entry_id: string
          type: Database["public"]["Enums"]["substitution_type"]
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          new_room?: string | null
          note?: string | null
          replacement_teacher_id?: string | null
          timetable_entry_id?: string
          type?: Database["public"]["Enums"]["substitution_type"]
        }
        Relationships: [
          {
            foreignKeyName: "timetable_substitutions_replacement_teacher_id_fkey"
            columns: ["replacement_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_substitutions_timetable_entry_id_fkey"
            columns: ["timetable_entry_id"]
            isOneToOne: false
            referencedRelation: "timetable_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          is_private: boolean
          linked_event_id: string | null
          linked_homework_id: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["todo_state"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_private?: boolean
          linked_event_id?: string | null
          linked_homework_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["todo_state"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_private?: boolean
          linked_event_id?: string | null
          linked_homework_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["todo_state"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_linked_homework_id_fkey"
            columns: ["linked_homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_profile_id: { Args: never; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_my_school_id: { Args: never; Returns: string }
      is_conversation_member: { Args: { _conv_id: string }; Returns: boolean }
      is_course_member: { Args: { _course_id: string }; Returns: boolean }
      is_course_teacher: { Args: { _course_id: string }; Returns: boolean }
      is_school_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      absence_type: "sick" | "excused" | "unexcused" | "late" | "other"
      app_role: "student" | "teacher" | "parent" | "admin"
      conversation_type: "direct" | "group" | "course"
      event_scope: "school" | "grade" | "course" | "custom"
      homework_state: "open" | "in_progress" | "done" | "submitted"
      priority_level: "low" | "normal" | "medium" | "high"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      substitution_type: "cancelled" | "replacement" | "room_change" | "note"
      todo_state: "open" | "in_progress" | "done"
      week_type: "all" | "a" | "b"
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
      absence_type: ["sick", "excused", "unexcused", "late", "other"],
      app_role: ["student", "teacher", "parent", "admin"],
      conversation_type: ["direct", "group", "course"],
      event_scope: ["school", "grade", "course", "custom"],
      homework_state: ["open", "in_progress", "done", "submitted"],
      priority_level: ["low", "normal", "medium", "high"],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      substitution_type: ["cancelled", "replacement", "room_change", "note"],
      todo_state: ["open", "in_progress", "done"],
      week_type: ["all", "a", "b"],
    },
  },
} as const
