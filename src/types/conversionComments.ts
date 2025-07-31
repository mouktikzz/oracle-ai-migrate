export interface ConversionComment {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  file_id: string;
  file_name: string;
  comment: string;
  conversion_id?: string;
  is_public: boolean;
}

export interface CreateCommentData {
  file_id: string;
  file_name: string;
  comment: string;
  conversion_id?: string;
  is_public?: boolean;
}

export interface UpdateCommentData {
  comment: string;
  is_public?: boolean;
} 