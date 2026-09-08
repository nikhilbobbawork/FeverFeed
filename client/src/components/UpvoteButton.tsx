// components/UpvoteButton.tsx
import React, { useState } from 'react';

interface UpvoteButtonProps {
  postId: string;
  initialCount: number;
  initialHasUpvoted: boolean;
}

export const UpvoteButton: React.FC<UpvoteButtonProps> = ({
  postId,
  initialCount,
  initialHasUpvoted,
}) => {
  const [upvoteCount, setUpvoteCount] = useState(initialCount);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleUpvote = async () => {
    if (isLoading) return;

    // Optimistic UI update
    const nextHasUpvoted = !hasUpvoted;
    const nextCount = hasUpvoted ? upvoteCount - 1 : upvoteCount + 1;

    setHasUpvoted(nextHasUpvoted);
    setUpvoteCount(nextCount);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to update upvote');

      const data = await response.json();
      setUpvoteCount(data.upvoteCount);
      setHasUpvoted(data.hasUpvoted);
    } catch (error) {
      // Revert state on failure
      setHasUpvoted(hasUpvoted);
      setUpvoteCount(upvoteCount);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleUpvote}
      disabled={isLoading}
      className={`button is-small ${hasUpvoted ? 'is-primary' : 'is-light'}`}
    >
      <span className="icon is-small">▲</span>
      <span>{upvoteCount}</span>
    </button>
  );
};