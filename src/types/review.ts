export interface Review {
  id: number;
  destination_id: number;
  user_id: string;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithProfile extends Review {
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface DestinationRating {
  destination_id: number;
  average_rating: number;
  review_count: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
}

export interface CreateReviewInput {
  destination_id: number;
  rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}
