
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "cities": {
                  Row: {
                    "country_code": string,"id": number,"location": unknown,"name": string,"population": number,"province_id": number | null,"region": string | null,"slug": string
                  }
                  Insert: {
                    "country_code": string,"id"?: never,"location": unknown,"name": string,"population"?: number,"province_id"?: number | null,"region"?: string | null,"slug": string
                  }
                  Update: {
                    "country_code"?: string,"id"?: never,"location"?: unknown,"name"?: string,"population"?: number,"province_id"?: number | null,"region"?: string | null,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cities_country_code_fkey"
      columns: ["country_code"]
isOneToOne: false
      referencedRelation: "countries"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "cities_province_id_fkey"
      columns: ["province_id"]
isOneToOne: false
      referencedRelation: "provinces"
      referencedColumns: ["id"]
    }
                  ]
                },"consent_records": {
                  Row: {
                    "action": string,"categories": NonNullable<Json>,"consent_id": string,"created_at": string,"id": number,"ip_hash": string | null,"policy_version": string,"user_id": string | null
                  }
                  Insert: {
                    "action": string,"categories": NonNullable<Json>,"consent_id": string,"created_at"?: string,"id"?: never,"ip_hash"?: string | null,"policy_version": string,"user_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"categories"?: NonNullable<Json>,"consent_id"?: string,"created_at"?: string,"id"?: never,"ip_hash"?: string | null,"policy_version"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "consent_records_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"countries": {
                  Row: {
                    "code": string,"name": string
                  }
                  Insert: {
                    "code": string,"name": string
                  }
                  Update: {
                    "code"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"favorites": {
                  Row: {
                    "created_at": string,"listing_id": number,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"listing_id": number,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"listing_id"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"listing_photos": {
                  Row: {
                    "created_at": string,"height": number | null,"id": string,"listing_id": number,"position": number,"storage_path": string,"width": number | null
                  }
                  Insert: {
                    "created_at"?: string,"height"?: number | null,"id"?: string,"listing_id": number,"position"?: number,"storage_path": string,"width"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"height"?: number | null,"id"?: string,"listing_id"?: number,"position"?: number,"storage_path"?: string,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "listing_photos_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    }
                  ]
                },"listing_price_history": {
                  Row: {
                    "changed_at": string,"id": number,"listing_id": number,"new_price": number,"old_price": number | null
                  }
                  Insert: {
                    "changed_at"?: string,"id"?: never,"listing_id": number,"new_price": number,"old_price"?: number | null
                  }
                  Update: {
                    "changed_at"?: string,"id"?: never,"listing_id"?: number,"new_price"?: number,"old_price"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "listing_price_history_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    }
                  ]
                },"listing_private": {
                  Row: {
                    "address": string | null,"contact_name": string | null,"contact_phone": string | null,"listing_id": number,"location_exact": unknown,"show_exact_location": boolean,"show_phone": boolean,"updated_at": string
                  }
                  Insert: {
                    "address"?: string | null,"contact_name"?: string | null,"contact_phone"?: string | null,"listing_id": number,"location_exact": unknown,"show_exact_location"?: boolean,"show_phone"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"contact_name"?: string | null,"contact_phone"?: string | null,"listing_id"?: number,"location_exact"?: unknown,"show_exact_location"?: boolean,"show_phone"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "listing_private_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: true
      referencedRelation: "listings"
      referencedColumns: ["id"]
    }
                  ]
                },"listings": {
                  Row: {
                    "area_m2": number | null,"bathrooms": number | null,"bedrooms": number | null,"city_id": number | null,"country_code": string | null,"created_at": string,"currency": string,"description": string | null,"energy_rating": string | null,"expires_at": string | null,"exterior": boolean | null,"features": (string)[],"floor": number | null,"id": number,"location": unknown,"neighborhood_id": number | null,"operation": Database["public"]['Enums']["listing_operation"],"owner_id": string,"previous_price": number | null,"price": number | null,"property_type": Database["public"]['Enums']["property_type"],"published_at": string | null,"rejection_reason": string | null,"search_vector": unknown,"status": Database["public"]['Enums']["listing_status"],"title": string | null,"updated_at": string,"views_count": number,"year_built": number | null
                  }
                  Insert: {
                    "area_m2"?: number | null,"bathrooms"?: number | null,"bedrooms"?: number | null,"city_id"?: number | null,"country_code"?: string | null,"created_at"?: string,"currency"?: string,"description"?: string | null,"energy_rating"?: string | null,"expires_at"?: string | null,"exterior"?: boolean | null,"features"?: (string)[],"floor"?: number | null,"id"?: never,"location"?: unknown,"neighborhood_id"?: number | null,"operation": Database["public"]['Enums']["listing_operation"],"owner_id"?: string,"previous_price"?: number | null,"price"?: number | null,"property_type": Database["public"]['Enums']["property_type"],"published_at"?: string | null,"rejection_reason"?: string | null,"search_vector"?: never,"status"?: Database["public"]['Enums']["listing_status"],"title"?: string | null,"updated_at"?: string,"views_count"?: number,"year_built"?: number | null
                  }
                  Update: {
                    "area_m2"?: number | null,"bathrooms"?: number | null,"bedrooms"?: number | null,"city_id"?: number | null,"country_code"?: string | null,"created_at"?: string,"currency"?: string,"description"?: string | null,"energy_rating"?: string | null,"expires_at"?: string | null,"exterior"?: boolean | null,"features"?: (string)[],"floor"?: number | null,"id"?: never,"location"?: unknown,"neighborhood_id"?: number | null,"operation"?: Database["public"]['Enums']["listing_operation"],"owner_id"?: string,"previous_price"?: number | null,"price"?: number | null,"property_type"?: Database["public"]['Enums']["property_type"],"published_at"?: string | null,"rejection_reason"?: string | null,"search_vector"?: never,"status"?: Database["public"]['Enums']["listing_status"],"title"?: string | null,"updated_at"?: string,"views_count"?: number,"year_built"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "listings_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listings_country_code_fkey"
      columns: ["country_code"]
isOneToOne: false
      referencedRelation: "countries"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "listings_neighborhood_id_fkey"
      columns: ["neighborhood_id"]
isOneToOne: false
      referencedRelation: "neighborhoods"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "listings_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"listing_id": number,"read_at": string | null,"recipient_id": string,"sender_email": string,"sender_id": string | null,"sender_name": string,"sender_phone": string | null
                  }
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"listing_id": number,"read_at"?: string | null,"recipient_id": string,"sender_email": string,"sender_id"?: string | null,"sender_name": string,"sender_phone"?: string | null
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"listing_id"?: number,"read_at"?: string | null,"recipient_id"?: string,"sender_email"?: string,"sender_id"?: string | null,"sender_name"?: string,"sender_phone"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"moderation_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"id": number,"listing_id": number | null,"note": string | null,"target_user_id": string | null
                  }
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"id"?: never,"listing_id"?: number | null,"note"?: string | null,"target_user_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"id"?: never,"listing_id"?: number | null,"note"?: string | null,"target_user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "moderation_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "moderation_log_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "moderation_log_target_user_id_fkey"
      columns: ["target_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"neighborhoods": {
                  Row: {
                    "city_id": number,"id": number,"location": unknown,"name": string,"slug": string
                  }
                  Insert: {
                    "city_id": number,"id"?: never,"location"?: unknown,"name": string,"slug": string
                  }
                  Update: {
                    "city_id"?: number,"id"?: never,"location"?: unknown,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "neighborhoods_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    }
                  ]
                },"phone_reveals": {
                  Row: {
                    "created_at": string,"id": number,"ip_hash": string | null,"listing_id": number,"viewer_id": string | null
                  }
                  Insert: {
                    "created_at"?: string,"id"?: never,"ip_hash"?: string | null,"listing_id": number,"viewer_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"ip_hash"?: string | null,"listing_id"?: number,"viewer_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "phone_reveals_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "phone_reveals_viewer_id_fkey"
      columns: ["viewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"privacy_requests": {
                  Row: {
                    "admin_note": string | null,"created_at": string,"details": string | null,"due_at": string,"email": string,"id": string,"ip_hash": string | null,"locale": string,"name": string | null,"reference": string,"resolved_at": string | null,"status": Database["public"]['Enums']["privacy_request_status"],"type": Database["public"]['Enums']["privacy_request_type"],"updated_at": string,"user_id": string | null
                  }
                  Insert: {
                    "admin_note"?: string | null,"created_at"?: string,"details"?: string | null,"due_at"?: string,"email": string,"id"?: string,"ip_hash"?: string | null,"locale"?: string,"name"?: string | null,"reference"?: string,"resolved_at"?: string | null,"status"?: Database["public"]['Enums']["privacy_request_status"],"type": Database["public"]['Enums']["privacy_request_type"],"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "admin_note"?: string | null,"created_at"?: string,"details"?: string | null,"due_at"?: string,"email"?: string,"id"?: string,"ip_hash"?: string | null,"locale"?: string,"name"?: string | null,"reference"?: string,"resolved_at"?: string | null,"status"?: Database["public"]['Enums']["privacy_request_status"],"type"?: Database["public"]['Enums']["privacy_request_type"],"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "privacy_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"id": string,"is_banned": boolean,"is_trusted": boolean,"locale": string,"phone": string | null,"role": Database["public"]['Enums']["user_role"],"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"id": string,"is_banned"?: boolean,"is_trusted"?: boolean,"locale"?: string,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"id"?: string,"is_banned"?: boolean,"is_trusted"?: boolean,"locale"?: string,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"provinces": {
                  Row: {
                    "code": string,"country_code": string,"id": number,"name": string,"slug": string
                  }
                  Insert: {
                    "code": string,"country_code": string,"id"?: never,"name": string,"slug": string
                  }
                  Update: {
                    "code"?: string,"country_code"?: string,"id"?: never,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "provinces_country_code_fkey"
      columns: ["country_code"]
isOneToOne: false
      referencedRelation: "countries"
      referencedColumns: ["code"]
    }
                  ]
                },"rate_limits": {
                  Row: {
                    "hits": number,"key": string,"window_start": string
                  }
                  Insert: {
                    "hits"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "hits"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"details": string | null,"id": string,"ip_hash": string | null,"listing_id": number,"locale": string,"reason": Database["public"]['Enums']["report_reason"],"reporter_email": string | null,"reporter_id": string | null,"resolved_at": string | null,"resolved_by": string | null,"status": Database["public"]['Enums']["report_status"]
                  }
                  Insert: {
                    "created_at"?: string,"details"?: string | null,"id"?: string,"ip_hash"?: string | null,"listing_id": number,"locale"?: string,"reason": Database["public"]['Enums']["report_reason"],"reporter_email"?: string | null,"reporter_id"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"]
                  }
                  Update: {
                    "created_at"?: string,"details"?: string | null,"id"?: string,"ip_hash"?: string | null,"listing_id"?: number,"locale"?: string,"reason"?: Database["public"]['Enums']["report_reason"],"reporter_email"?: string | null,"reporter_id"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_listing_id_fkey"
      columns: ["listing_id"]
isOneToOne: false
      referencedRelation: "listings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_resolved_by_fkey"
      columns: ["resolved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"saved_searches": {
                  Row: {
                    "created_at": string,"filters": NonNullable<Json>,"frequency": Database["public"]['Enums']["alert_frequency"],"id": string,"is_active": boolean,"last_sent_at": string | null,"locale": string,"name": string,"unsubscribe_token": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"filters": NonNullable<Json>,"frequency"?: Database["public"]['Enums']["alert_frequency"],"id"?: string,"is_active"?: boolean,"last_sent_at"?: string | null,"locale"?: string,"name": string,"unsubscribe_token"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"filters"?: NonNullable<Json>,"frequency"?: Database["public"]['Enums']["alert_frequency"],"id"?: string,"is_active"?: boolean,"last_sent_at"?: string | null,"locale"?: string,"name"?: string,"unsubscribe_token"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_searches_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_user_email":
{ Args: { "p_user_id": string }; Returns: string
                           },
"admin_users":
{ Args: { "p_limit"?: number,"p_query"?: string }; Returns: {
              "created_at": string,"display_name": string,"email": string,"id": string,"is_banned": boolean,"is_trusted": boolean,"listings": number,"role": Database["public"]['Enums']["user_role"]
            }[]
                           },
"expire_listings":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"f_unaccent":
{ Args: { "value": string }; Returns: string
                           },
"fuzz_location":
{ Args: { "exact": unknown,"seed": string }; Returns: unknown
                           },
"gdpr_retention":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"get_city":
{ Args: { "p_id": number }; Returns: {
              "country_code": string,"id": number,"lat": number,"lng": number,"name": string,"region": string,"slug": string
            }[]
                           },
"get_province":
{ Args: { "p_id": number }; Returns: {
              "country_code": string,"id": number,"name": string,"slug": string
            }[]
                           },
"hit_rate_limit":
{ Args: { "p_key": string,"p_limit": number,"p_window_seconds": number }; Returns: boolean
                           },
"increment_listing_views":
{ Args: { "p_listing_id": number }; Returns: undefined
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_banned":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_privileged_context":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"listing_has_phone":
{ Args: { "p_listing_id": number }; Returns: boolean
                           },
"listing_private_point":
{ Args: { "p_listing_id": number }; Returns: {
              "lat": number,"lng": number
            }[]
                           },
"listing_public_point":
{ Args: { "p_listing_id": number }; Returns: {
              "exact": boolean,"lat": number,"lng": number
            }[]
                           },
"moderate_listing":
{ Args: { "p_action": string,"p_listing_id": number,"p_note"?: string }; Returns: undefined
                           },
"my_listing_stats":
{ Args: Record<PropertyKey, never>; Returns: {
              "favorites": number,"listing_id": number,"messages": number,"reveals": number
            }[]
                           },
"nearby_places":
{ Args: { "p_city_id"?: number,"p_country"?: string,"p_limit"?: number,"p_neighborhood_id"?: number,"p_operation": Database["public"]['Enums']["listing_operation"],"p_province_id"?: number,"p_types"?: (Database["public"]['Enums']["property_type"])[] }; Returns: {
              "city_slug": string,"kind": string,"listings": number,"name": string,"slug": string
            }[]
                           },
"public_profile":
{ Args: { "p_user_id": string }; Returns: {
              "created_at": string,"display_name": string
            }[]
                           },
"renew_listing":
{ Args: { "p_listing_id": number }; Returns: undefined
                           },
"resolve_report":
{ Args: { "p_report_id": string,"p_status": Database["public"]['Enums']["report_status"] }; Returns: undefined
                           },
"search_cities":
{ Args: { "country"?: string,"max_results"?: number,"q": string }; Returns: {
              "country_code": string,"id": number,"lat": number,"lng": number,"name": string,"region": string,"slug": string
            }[]
                           },
"search_listing_markers":
{ Args: { "p_area_max"?: number,"p_area_min"?: number,"p_bathrooms_min"?: number,"p_bedrooms_min"?: number,"p_city_id"?: number,"p_country"?: string,"p_east"?: number,"p_features"?: (string)[],"p_neighborhood_id"?: number,"p_north"?: number,"p_operation": Database["public"]['Enums']["listing_operation"],"p_price_max"?: number,"p_price_min"?: number,"p_province_id"?: number,"p_south"?: number,"p_types"?: (Database["public"]['Enums']["property_type"])[],"p_west"?: number }; Returns: {
              "id": number,"lat": number,"lng": number,"price": number
            }[]
                           },
"search_listings":
{ Args: { "p_area_max"?: number,"p_area_min"?: number,"p_bathrooms_min"?: number,"p_bedrooms_min"?: number,"p_city_id"?: number,"p_country"?: string,"p_east"?: number,"p_features"?: (string)[],"p_limit"?: number,"p_neighborhood_id"?: number,"p_north"?: number,"p_offset"?: number,"p_operation": Database["public"]['Enums']["listing_operation"],"p_price_max"?: number,"p_price_min"?: number,"p_province_id"?: number,"p_sort"?: string,"p_south"?: number,"p_types"?: (Database["public"]['Enums']["property_type"])[],"p_west"?: number }; Returns: Json
                           },
"seller_type":
{ Args: { "p_user_id": string }; Returns: string
                           },
"set_user_banned":
{ Args: { "p_banned": boolean,"p_note"?: string,"p_user_id": string }; Returns: undefined
                           },
"slugify":
{ Args: { "value": string }; Returns: string
                           },
"update_privacy_request":
{ Args: { "p_id": string,"p_note"?: string,"p_status": Database["public"]['Enums']["privacy_request_status"] }; Returns: undefined
                           }
          }
          Enums: {
            "alert_frequency": "instant"|"daily"|"weekly","listing_operation": "sale"|"rent","listing_status": "draft"|"pending"|"active"|"paused"|"closed"|"rejected"|"expired"|"removed","privacy_request_status": "received"|"verifying"|"in_progress"|"completed"|"rejected","privacy_request_type": "access"|"rectification"|"erasure"|"restriction"|"portability"|"objection"|"withdraw_consent"|"other","property_type": "apartment"|"penthouse"|"duplex"|"studio"|"house"|"villa"|"country_house"|"room"|"land"|"commercial"|"office"|"garage","report_reason": "scam"|"wrong_info"|"already_sold"|"duplicate"|"offensive"|"agency_posing_as_owner"|"other","report_status": "open"|"resolved"|"dismissed","user_role": "user"|"agency"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "alert_frequency": ["instant", "daily", "weekly"],"listing_operation": ["sale", "rent"],"listing_status": ["draft", "pending", "active", "paused", "closed", "rejected", "expired", "removed"],"privacy_request_status": ["received", "verifying", "in_progress", "completed", "rejected"],"privacy_request_type": ["access", "rectification", "erasure", "restriction", "portability", "objection", "withdraw_consent", "other"],"property_type": ["apartment", "penthouse", "duplex", "studio", "house", "villa", "country_house", "room", "land", "commercial", "office", "garage"],"report_reason": ["scam", "wrong_info", "already_sold", "duplicate", "offensive", "agency_posing_as_owner", "other"],"report_status": ["open", "resolved", "dismissed"],"user_role": ["user", "agency", "admin"]
          }
        }
} as const

