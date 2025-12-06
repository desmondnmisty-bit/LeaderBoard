'use client';

import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useLeaderboard } from '../lib/LeaderboardContext';

export default function ScoreSubmissionForm() {
  const [playerName, setPlayerName] = useState('');
  const [score, setScore] = useState('');
  const [metadata, setMetadata] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { submitScore } = useApi();
  const { refreshPlayers } = useLeaderboard();

  const validateForm = () => {
    if (!playerName.trim()) return 'Player name is required';
    if (!score || isNaN(Number(score))) return 'Valid score is required';
    if (metadata && !isValidJson(metadata)) return 'Metadata must be valid JSON';
    return null;
  };

  const isValidJson = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      setMessage({ type: 'error', text: error });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Normalize playerId: lowercase, replace spaces/special chars with hyphens, remove duplicates
      const playerId = playerName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
        .replace(/-+/g, '-');          // Collapse multiple hyphens
      
      const result = await submitScore({
        playerId,
        playerName: playerName.trim(),
        score: Number(score),
        metadata: metadata ? JSON.parse(metadata) : undefined,
      });

      if (result.success) {
        setMessage({ type: 'success', text: `Score +${Number(score).toLocaleString()} added! New total: ${result.data?.score?.toLocaleString() || 'N/A'}` });
        setPlayerName('');
        setScore('');
        setMetadata('');
        // Refresh the leaderboard to show updated scores
        await refreshPlayers();
        console.log('[ScoreSubmission] Refresh complete');
      } else {
        setMessage({ type: 'error', text: result.error?.message || 'Failed to submit score' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">Submit Score</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-text-primary mb-1">
              Player Name *
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="input-field w-full px-3 py-2 rounded-md focus-ring"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label htmlFor="score" className="block text-sm font-medium text-text-primary mb-1">
              Score *
            </label>
            <input
              type="number"
              id="score"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="input-field w-full px-3 py-2 rounded-md focus-ring"
              placeholder="Enter score"
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="metadata" className="block text-sm font-medium text-text-primary mb-1">
            Metadata (JSON, optional)
          </label>
          <textarea
            id="metadata"
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            className="input-field w-full px-3 py-2 rounded-md focus-ring"
            placeholder='{"level": 5, "country": "US"}'
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-ring"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Score'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.type === 'success'
            ? 'bg-success/10 text-success border border-success/20'
            : 'bg-error/10 text-error border border-error/20'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}