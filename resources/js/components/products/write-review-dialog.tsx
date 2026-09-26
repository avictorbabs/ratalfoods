import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { FormEvent, useState } from 'react';

type WriteReviewDialogProps = {
    productId: number;
    productName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function WriteReviewDialog({ productId, productName, open, onOpenChange }: WriteReviewDialogProps) {
    const [hoverRating, setHoverRating] = useState(0);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        customer_name: '',
        customer_email: '',
        rating: 0,
        comment: '',
    });

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);

        if (!next) {
            reset();
            clearErrors();
            setHoverRating(0);
        }
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        post(`/menu/${productId}/reviews`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-heading">Write a Review</DialogTitle>
                    <DialogDescription>Share your experience with {productName}.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label required>Your rating</Label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setData('rating', value)}
                                    onMouseEnter={() => setHoverRating(value)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-0.5"
                                    aria-label={`${value} star${value > 1 ? 's' : ''}`}
                                >
                                    <Star
                                        className={cn(
                                            'h-6 w-6 transition-colors',
                                            (hoverRating || data.rating) >= value
                                                ? 'fill-primary text-primary'
                                                : 'text-muted-foreground/40 fill-none',
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                        {errors.rating && <p className="font-body text-destructive text-sm">{errors.rating}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="review-name" required>
                            Name
                        </Label>
                        <Input
                            id="review-name"
                            required
                            value={data.customer_name}
                            onChange={(event) => setData('customer_name', event.target.value)}
                        />
                        {errors.customer_name && <p className="font-body text-destructive text-sm">{errors.customer_name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="review-email">Email (optional)</Label>
                        <Input
                            id="review-email"
                            type="email"
                            value={data.customer_email}
                            onChange={(event) => setData('customer_email', event.target.value)}
                        />
                        {errors.customer_email && <p className="font-body text-destructive text-sm">{errors.customer_email}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="review-comment" required>
                            Your review
                        </Label>
                        <Textarea
                            id="review-comment"
                            required
                            rows={4}
                            value={data.comment}
                            onChange={(event) => setData('comment', event.target.value)}
                            placeholder="What did you think of this dish?"
                        />
                        {errors.comment && <p className="font-body text-destructive text-sm">{errors.comment}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || data.rating === 0}>
                            {processing ? 'Submitting…' : 'Submit Review'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
