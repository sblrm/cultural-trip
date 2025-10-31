import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReviewCard } from './ReviewCard';
import { StarRating } from './StarRating';
import { Progress } from '@/components/ui/progress';
import type { ReviewWithProfile, DestinationRating } from '@/types/review';

interface ReviewListProps {
  reviews: ReviewWithProfile[];
  rating: DestinationRating | null;
  currentUserId?: string;
  onEditReview?: (review: ReviewWithProfile) => void;
  onDeleteReview?: (reviewId: number) => void;
}

export function ReviewList({
  reviews,
  rating,
  currentUserId,
  onEditReview,
  onDeleteReview,
}: ReviewListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  if (!rating || rating.review_count === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Belum ada review untuk destinasi ini. Jadilah yang pertama!
        </CardContent>
      </Card>
    );
  }

  const ratingDistribution = [
    { stars: 5, count: rating.five_star_count },
    { stars: 4, count: rating.four_star_count },
    { stars: 3, count: rating.three_star_count },
    { stars: 2, count: rating.two_star_count },
    { stars: 1, count: rating.one_star_count },
  ];

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Rating & Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
              <div className="text-5xl font-bold mb-2">
                {rating.average_rating.toFixed(1)}
              </div>
              <StarRating 
                rating={Math.round(rating.average_rating)} 
                readonly 
                size="lg" 
              />
              <div className="text-sm text-muted-foreground mt-2">
                Dari {rating.review_count} review
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ stars, count }) => {
                const percentage = rating.review_count > 0 
                  ? (count / rating.review_count) * 100 
                  : 0;
                
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-8">{stars} ★</span>
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          Semua Review ({reviews.length})
        </h3>
        
        {/* Paginated Reviews */}
        {(() => {
          const totalPages = Math.ceil(reviews.length / reviewsPerPage);
          const startIndex = (currentPage - 1) * reviewsPerPage;
          const endIndex = startIndex + reviewsPerPage;
          const currentReviews = reviews.slice(startIndex, endIndex);

          return (
            <>
              {currentReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isOwnReview={currentUserId === review.user_id}
                  onEdit={() => onEditReview?.(review)}
                  onDelete={() => onDeleteReview?.(review.id)}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first, last, current, and adjacent pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
