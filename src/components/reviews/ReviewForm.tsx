import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from './StarRating';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  destinationName: string;
  existingRating?: number;
  existingComment?: string;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
}

export function ReviewForm({
  destinationName,
  existingRating = 0,
  existingComment = '',
  onSubmit,
  onCancel,
  isEdit = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingRating);
  const [comment, setComment] = useState(existingComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Silakan pilih rating bintang');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Review minimal 10 karakter');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment.trim());
      if (!isEdit) {
        // Reset form for new reviews
        setRating(0);
        setComment('');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEdit ? 'Edit Review' : 'Tulis Review'} untuk {destinationName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Rating Anda
            </label>
            <StarRating 
              rating={rating} 
              onChange={setRating} 
              size="lg"
            />
          </div>

          <div>
            <label htmlFor="comment" className="text-sm font-medium mb-2 block">
              Review Anda
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalaman Anda di destinasi ini... (minimal 10 karakter)"
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length} karakter
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Review' : 'Kirim Review'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Batal
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
