import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StarRating } from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Pencil, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ReviewWithProfile } from '@/types/review';

interface ReviewCardProps {
  review: ReviewWithProfile;
  isOwnReview?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ReviewCard({ review, isOwnReview, onEdit, onDelete }: ReviewCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const username = review.profiles?.username || 'Anonymous';
  const fullName = review.profiles?.full_name || username;
  const avatarUrl = review.profiles?.avatar_url;
  const initials = username.substring(0, 2).toUpperCase();

  const timeAgo = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
    locale: id,
  });

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.();
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl || undefined} alt={username} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{fullName}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={review.rating} readonly size="sm" />
                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                  </div>
                </div>

                {isOwnReview && (onEdit || onDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem onClick={onEdit}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Review
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus Review
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {review.comment && (
                <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">
                  {review.comment}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Review?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus review ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
